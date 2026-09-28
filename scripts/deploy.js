import hre from "hardhat";

async function main() {
    console.log("==============================================");
    console.log("DIGITAL ASSET PROVENANCE - LOCAL DEPLOYMENT");
    console.log("==============================================");

    const { ethers } = await hre.network.connect();

    // Local accounts
    const [deployer, minter, moderator] = await ethers.getSigners();

    console.log("\nAccounts:");
    console.log("Deployer :", deployer.address);
    console.log("Minter   :", minter.address);
    console.log("Moderator:", moderator.address);

    // Contract factory
    const DigitalAssetProvenance =
        await ethers.getContractFactory("DigitalAssetProvenance");

    console.log("\nDeploying contract...");

    // Constructor requires moderator address
    const contract = await DigitalAssetProvenance.deploy(
        moderator.address
    );

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    console.log("\nDigitalAssetProvenance deployed to:");
    console.log(contractAddress);

    // Network information
    const network = await ethers.provider.getNetwork();

    console.log("\nNetwork Information:");
    console.log("Chain ID:", network.chainId.toString());
    console.log("RPC: http://127.0.0.1:8545");

    // Confirm moderator role using the standard AccessControl API.
    // The role identifier is obtained from the contract interface.
    const MODERATOR_ROLE = ethers.keccak256(
        ethers.toUtf8Bytes("MODERATOR_ROLE")
    );

    const moderatorHasRole = await contract.hasRole(
        MODERATOR_ROLE,
        moderator.address
    );

    console.log("\nRole Verification:");
    console.log(
        "Moderator has MODERATOR_ROLE:",
        moderatorHasRole
    );

    console.log("\n==============================================");
    console.log("DEPLOYMENT SUCCESSFUL");
    console.log("==============================================");

    console.log("\nContract Address:");
    console.log(contractAddress);

    console.log("\nDeployer:");
    console.log(deployer.address);

    console.log("\nModerator:");
    console.log(moderator.address);

    console.log("\nChain ID:");
    console.log(network.chainId.toString());

    console.log("\n==============================================");
}

main().catch((error) => {
    console.error("\nDEPLOYMENT FAILED");
    console.error(error);
    process.exitCode = 1;
});