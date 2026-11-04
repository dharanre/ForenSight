import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import Request

logger = logging.getLogger(__name__)

class EventPublisher:
    def __init__(self):
        # Maps case_id -> set of asyncio.Queue
        self._case_subscribers: Dict[str, Set[asyncio.Queue]] = {}
        # Global subscribers (for watchdog, global dashboard)
        self._global_subscribers: Set[asyncio.Queue] = set()

    def subscribe(self, case_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        if case_id not in self._case_subscribers:
            self._case_subscribers[case_id] = set()
        self._case_subscribers[case_id].add(q)
        self._global_subscribers.add(q)
        return q

    def unsubscribe(self, case_id: str, q: asyncio.Queue):
        if case_id in self._case_subscribers:
            self._case_subscribers[case_id].discard(q)
            if not self._case_subscribers[case_id]:
                del self._case_subscribers[case_id]
        self._global_subscribers.discard(q)

    async def broadcast(self, case_id: str, event_type: str, data: dict):
        payload = json.dumps({"event_type": event_type, "data": data})
        message = f"event: {event_type}\ndata: {payload}\n\n"

        # Send to specific case subscribers
        targets = set()
        if case_id in self._case_subscribers:
            targets.update(self._case_subscribers[case_id])
        targets.update(self._global_subscribers)

        for q in targets:
            try:
                await q.put(message)
            except Exception:
                pass

event_publisher = EventPublisher()
