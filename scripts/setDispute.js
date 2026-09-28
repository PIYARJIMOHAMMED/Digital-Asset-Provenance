import hre from "hardhat";

async function main() {
    console.log("==============================================");
    console.log("DIGITAL ASSET DISPUTE FLAG");
    console.log("==============================================");

    const { ethers } = await hre.network.connect();

    const signers = await ethers.getSigners();

    const moderator = signers[2];

    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is not set.");
    }

    const contract = await ethers.getContractAt(
        "DigitalAssetProvenance",
        contractAddress,
        moderator
    );

    const tokenId = 1;

    console.log("\nContract:", contractAddress);
    console.log("Token ID:", tokenId);
    console.log("Moderator:", moderator.address);

    const MODERATOR_ROLE = ethers.keccak256(
        ethers.toUtf8Bytes("MODERATOR_ROLE")
    );

    const hasModeratorRole = await contract.hasRole(
        MODERATOR_ROLE,
        moderator.address
    );

    console.log("\nModerator role verified:", hasModeratorRole);

    if (!hasModeratorRole) {
        throw new Error("Connected account does not have MODERATOR_ROLE.");
    }

    const before = await contract.isDisputed(tokenId);

    console.log("Disputed before:", before);

    console.log("\nSubmitting dispute transaction...");

    const tx = await contract.setDispute(tokenId, true);

    console.log("Transaction submitted:", tx.hash);

    const receipt = await tx.wait();

    console.log("\nTransaction confirmed.");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    const after = await contract.isDisputed(tokenId);

    console.log("\nDispute Result:");
    console.log("Disputed after:", after);

    console.log("\n==============================================");
    console.log("DISPUTE FLAG COMPLETE");
    console.log("==============================================");
}

main().catch((error) => {
    console.error("\nDISPUTE FAILED");
    console.error(error);
    process.exitCode = 1;
});