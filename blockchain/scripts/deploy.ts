import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying ForenChainRegistry contract...");

  const ForenChainRegistry = await ethers.getContractFactory("ForenChainRegistry");
  const registry = await ForenChainRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`ForenChainRegistry deployed at: ${contractAddress}`);

  // Export deployment info for backend and frontend use
  const deploymentInfo = {
    contractAddress,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "..", "deployed");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "contract-address.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment information saved to deployed/contract-address.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
