import hashlib
import json
import os
from typing import List, Dict, Tuple, Optional

class MerkleTree:
    """
    Computes a cryptographic Merkle tree from ordered block hashes.
    Handles odd number of leaves deterministically by duplicating the last leaf.
    """
    @staticmethod
    def hash_pair(left_hex: str, right_hex: str) -> str:
        try:
            left_bytes = bytes.fromhex(left_hex)
        except ValueError:
            left_bytes = hashlib.sha256(left_hex.encode("utf-8")).digest()
        try:
            right_bytes = bytes.fromhex(right_hex)
        except ValueError:
            right_bytes = hashlib.sha256(right_hex.encode("utf-8")).digest()
        return hashlib.sha256(left_bytes + right_bytes).hexdigest().lower()

    @classmethod
    def compute_root_from_leaves(cls, leaves: List[str]) -> str:
        if not leaves:
            return hashlib.sha256(b"").hexdigest().lower()
        if len(leaves) == 1:
            return leaves[0]

        current_level = list(leaves)
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                if i + 1 < len(current_level):
                    right = current_level[i + 1]
                else:
                    # Pad odd leaf by pairing with itself
                    right = left
                next_level.append(cls.hash_pair(left, right))
            current_level = next_level

        return current_level[0]

    @classmethod
    def generate_proof(cls, leaves: List[str], target_index: int) -> List[Dict[str, str]]:
        """
        Generates Merkle audit proof for a leaf at target_index.
        Returns list of {"position": "left"|"right", "hash": "<hex>"}.
        """
        if not leaves or target_index < 0 or target_index >= len(leaves):
            return []

        proof = []
        current_level = list(leaves)
        idx = target_index

        while len(current_level) > 1:
            is_odd = (idx % 2 == 1)
            pair_idx = idx - 1 if is_odd else idx + 1
            
            if pair_idx < len(current_level):
                sibling_hash = current_level[pair_idx]
            else:
                sibling_hash = current_level[idx] # Duplicated leaf

            proof.append({
                "position": "left" if is_odd else "right",
                "hash": sibling_hash
            })

            # Move to parent level
            next_level = []
            for i in range(0, len(current_level), 2):
                l = current_level[i]
                r = current_level[i + 1] if i + 1 < len(current_level) else l
                next_level.append(cls.hash_pair(l, r))
            current_level = next_level
            idx = idx // 2

        return proof

    @classmethod
    def verify_proof(cls, leaf: str, proof: List[Dict[str, str]], expected_root: str) -> bool:
        current = leaf
        for step in proof:
            pos = step["position"]
            sibling = step["hash"]
            if pos == "left":
                current = cls.hash_pair(sibling, current)
            else:
                current = cls.hash_pair(current, sibling)
        return current.lower() == expected_root.lower()


def generate_block_manifest(file_path: str, block_size: int = 4096) -> Dict:
    """
    Slices file into fixed-size blocks (default 4 KiB), computes SHA-256 for each block,
    builds the Merkle tree, and returns the manifest dictionary.
    """
    blocks = []
    block_hashes = []
    file_size = os.path.getsize(file_path)

    with open(file_path, "rb") as f:
        block_index = 0
        while True:
            offset_start = block_index * block_size
            data = f.read(block_size)
            if not data:
                break
            length = len(data)
            block_sha256 = hashlib.sha256(data).hexdigest().lower()
            
            blocks.append({
                "index": block_index,
                "offset_start": offset_start,
                "offset_end": offset_start + length,
                "length": length,
                "sha256": block_sha256
            })
            block_hashes.append(block_sha256)
            block_index += 1

    merkle_root = MerkleTree.compute_root_from_leaves(block_hashes)

    manifest = {
        "file_size": file_size,
        "block_size": block_size,
        "total_blocks": len(blocks),
        "hash_algorithm": "SHA-256",
        "merkle_root": merkle_root,
        "blocks": blocks
    }
    return manifest

def save_manifest(manifest: Dict, manifest_path: str) -> None:
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

def load_manifest(manifest_path: str) -> Dict:
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)
