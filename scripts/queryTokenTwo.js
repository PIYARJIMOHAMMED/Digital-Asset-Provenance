import hre from "hardhat";

async function main() {
    console.log("==========================================");
    console.log("DIGITAL ASSET PROVENANCE - TOKEN 2");
    console.log("==========================================");

    const { ethers } = await hre.network.connect();

    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is not set.");
    }

    const contract = await ethers.getContractAt(
        "DigitalAssetProvenance",
        contractAddress
    );

    const tokenId = 2;

    const record = await contract.getProvenance(tokenId);

    console.log("Token ID:", tokenId);
    console.log("Content Digest:", record.contentDigest);
    console.log("Metadata Digest:", record.metadataDigest);
    console.log("Creator:", record.creator);
    console.log("Minter:", record.minter);
    console.log("Declaration:", record.declaration);
    console.log("Declared Tool:", record.declaredTool);
    console.log("License URI:", record.licenseURI);
    console.log("Disputed:", record.disputed);
    console.log("Created At:", record.createdAt.toString());

    console.log("==========================================");
}

main().catch((error) => {
    console.error("\nQUERY FAILED");
    console.error(error);
    process.exitCode = 1;
});