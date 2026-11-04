import json
import os
import solcx
from web3 import Web3
from eth_tester import EthereumTester, PyEVMBackend

CONTRACT_SOURCE_PATH = os.path.join(os.path.dirname(__file__), "..", "blockchain", "contracts", "ForenChainRegistry.sol")
DEPLOYED_DIR = os.path.join(os.path.dirname(__file__), "..", "blockchain", "deployed")
OUTPUT_PATH = os.path.join(DEPLOYED_DIR, "contract-address.json")
ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "..", "blockchain", "artifacts", "contracts", "ForenChainRegistry.sol")

def compile_and_export():
    print("Compiling ForenChainRegistry.sol with Solc 0.8.20...")
    with open(CONTRACT_SOURCE_PATH, "r", encoding="utf-8") as f:
        source_code = f.read()

    solcx.set_solc_version("0.8.20")
    compiled = solcx.compile_source(
        source_code,
        output_values=["abi", "bin"]
    )
    
    contract_id = "<stdin>:ForenChainRegistry"
    contract_data = compiled[contract_id]
    abi = contract_data["abi"]
    bytecode = contract_data["bin"]

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with open(os.path.join(ARTIFACT_DIR, "ForenChainRegistry.json"), "w", encoding="utf-8") as f:
        json.dump({"abi": abi, "bytecode": bytecode}, f, indent=2)
    print("Exported ABI and bytecode artifact to blockchain/artifacts.")

    return abi, bytecode

if __name__ == "__main__":
    compile_and_export()
