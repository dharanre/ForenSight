import json
import os
from typing import Dict, Any, Optional
from web3 import Web3
from app.core.config import settings

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        self.contract = None
        self.contract_address = None
        self._load_contract()

    def _load_contract(self):
        if not os.path.exists(settings.CONTRACT_ADDRESS_FILE):
            return

        try:
            with open(settings.CONTRACT_ADDRESS_FILE, "r") as f:
                info = json.load(f)
                self.contract_address = info.get("contractAddress")

            # Load ABI from Hardhat artifacts if compiled
            abi_path = os.path.join(
                os.path.dirname(settings.CONTRACT_ADDRESS_FILE),
                "..", "artifacts", "contracts", "ForenChainRegistry.sol", "ForenChainRegistry.json"
            )
            if os.path.exists(abi_path):
                with open(abi_path, "r") as f:
                    artifact = json.load(f)
                    abi = artifact.get("abi")
                if self.w3.is_connected() and self.contract_address:
                    self.contract = self.w3.eth.contract(address=self.contract_address, abi=abi)
        except Exception:
            self.contract = None

    def is_connected(self) -> bool:
        try:
            return self.w3.is_connected() and self.contract is not None
        except Exception:
            return False

    def anchor_evidence(
        self,
        evidence_id: str,
        sha256_hash: str,
        merkle_root: str,
        analysis_report_hash: str
    ) -> Dict[str, Any]:
        """
        Anchors evidence hashes and Merkle root on the ForenChain smart contract.
        If chain is unavailable and fallback is enabled, returns FALLBACK_DB status.
        Never mislabels fallback records as blockchain transactions.
        """
        if not self.is_connected():
            return {
                "status": "FALLBACK_DB",
                "tx_hash": None,
                "block_number": None,
                "anchored_on_chain": False,
                "message": "Blockchain node unreachable or contract not deployed. Integrity record saved to local database anchor fallback."
            }

        try:
            accounts = self.w3.eth.accounts
            if not accounts:
                raise Exception("No accounts available in connected Web3 provider")
            sender = accounts[0]

            tx = self.contract.functions.registerEvidence(
                evidence_id,
                sha256_hash,
                merkle_root,
                analysis_report_hash
            ).transact({"from": sender})

            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            
            return {
                "status": "ANCHORED_CHAIN",
                "tx_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "anchored_on_chain": True,
                "message": f"Successfully anchored on-chain in block #{receipt.blockNumber}."
            }
        except Exception as e:
            return {
                "status": "FALLBACK_DB",
                "tx_hash": None,
                "block_number": None,
                "anchored_on_chain": False,
                "error": str(e),
                "message": f"Blockchain transaction failed ({str(e)}). Fallen back to local database anchor."
            }

    def anchor_custody_event(
        self,
        evidence_id: str,
        event_id: str,
        event_type: str,
        event_record_hash: str
    ) -> Dict[str, Any]:
        if not self.is_connected():
            return {
                "anchored_on_chain": False,
                "tx_hash": None
            }

        try:
            accounts = self.w3.eth.accounts
            if not accounts:
                return {"anchored_on_chain": False, "tx_hash": None}
            sender = accounts[0]

            tx = self.contract.functions.logCustodyEvent(
                evidence_id,
                event_id,
                event_type,
                event_record_hash
            ).transact({"from": sender})

            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            return {
                "anchored_on_chain": True,
                "tx_hash": receipt.transactionHash.hex()
            }
        except Exception:
            return {
                "anchored_on_chain": False,
                "tx_hash": None
            }

    def verify_on_chain_integrity(
        self,
        evidence_id: str,
        sha256_hash: str,
        merkle_root: str
    ) -> Dict[str, Any]:
        if not self.is_connected():
            return {
                "available": False,
                "matches": None,
                "message": "Blockchain offline. On-chain verification unavailable."
            }

        try:
            matches = self.contract.functions.verifyIntegrity(
                evidence_id,
                sha256_hash,
                merkle_root
            ).call()
            return {
                "available": True,
                "matches": matches,
                "message": "On-chain integrity verification passed." if matches else "On-chain record mismatch!"
            }
        except Exception as e:
            return {
                "available": False,
                "matches": None,
                "error": str(e)
            }

blockchain_service = BlockchainService()
