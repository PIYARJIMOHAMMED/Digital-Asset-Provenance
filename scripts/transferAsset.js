import hre from "hardhat";

async function main() {
    console.log("==============================================");
    console.log("DIGITAL ASSET TRANSFER");
    console.log("==============================================");

    const { ethers } = await hre.network.connect();

    const [owner, recipient] = await ethers.getSigners();

    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is not set.");
    }

    const contract = await ethers.getContractAt(
        "DigitalAssetProvenance",
        contractAddress,
        owner
    );

    const tokenId = 1;

    console.log("\nContract:", contractAddress);
    console.log("Token ID:", tokenId);
    console.log("Current owner:", owner.address);
    console.log("Recipient:", recipient.address);

    const currentOwner = await contract.ownerOf(tokenId);

    console.log("\nVerified current owner:");
    console.log(currentOwner);

    if (currentOwner.toLowerCase() !== owner.address.toLowerCase()) {
        throw new Error(
            `Token ${tokenId} is not owned by the expected account.`
        );
    }

    console.log("\nSubmitting transfer transaction...");

    const tx = await contract.transferFrom(
        owner.address,
        recipient.address,
        tokenId
    );

    console.log("Transaction submitted:", tx.hash);

    const receipt = await tx.wait();

    console.log("\nTransaction confirmed.");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    const newOwner = await contract.ownerOf(tokenId);

    console.log("\nTransfer Result:");
    console.log("New owner:", newOwner);

    console.log("\n==============================================");
    console.log("TRANSFER COMPLETE");
    console.log("==============================================");
}

main().catch((error) => {
    console.error("\nTRANSFER FAILED");
    console.error(error);
    process.exitCode = 1;
});