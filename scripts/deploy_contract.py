import json
import os
from web3 import Web3

RPC_URL = "http://127.0.0.1:8545"
ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "..", "blockchain", "artifacts", "contracts", "ForenChainRegistry.sol", "ForenChainRegistry.json")
DEPLOYED_DIR = os.path.join(os.path.dirname(__file__), "..", "blockchain", "deployed")
OUTPUT_PATH = os.path.join(DEPLOYED_DIR, "contract-address.json")

def deploy():
    print(f"Connecting to blockchain at {RPC_URL}...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        raise SystemError("Could not connect to local Ethereum node.")

    with open(ARTIFACT_PATH, "r", encoding="utf-8") as f:
        artifact = json.load(f)

    abi = artifact["abi"]
    bytecode = artifact["bytecode"]

    account = w3.eth.accounts[0]
    print(f"Deploying from account: {account}...")

    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    tx_hash = Contract.constructor().transact({"from": account})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    contract_address = receipt.contractAddress
    print(f"Contract deployed successfully at address: {contract_address}")
    print(f"Transaction hash: {receipt.transactionHash.hex()}")

    os.makedirs(DEPLOYED_DIR, exist_ok=True)
    deployment_info = {
        "contractAddress": contract_address,
        "network": "localhost",
        "deployer": account,
        "txHash": receipt.transactionHash.hex(),
        "blockNumber": receipt.blockNumber
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(deployment_info, f, indent=2)
    print(f"Saved deployment details to {OUTPUT_PATH}")

if __name__ == "__main__":
    deploy()
