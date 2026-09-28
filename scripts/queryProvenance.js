import hre from "hardhat";

async function main() {
    const { ethers } = await hre.network.connect();

    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error(
            "CONTRACT_ADDRESS environment variable is required."
        );
    }

    const contract = await ethers.getContractAt(
        "DigitalAssetProvenance",
        contractAddress
    );

    const tokenId = 1;

    console.log("==========================================");
    console.log("DIGITAL ASSET PROVENANCE");
    console.log("==========================================");

    const record = await contract.getProvenance(tokenId);

    console.log("Token ID:", tokenId);
    console.log("Content Digest:", record.contentDigest);
    console.log("Metadata Digest:", record.metadataDigest);

    // These fields depend on your contract's exact struct.
    console.log("Creator:", record.creator);

    if (record.minter !== undefined) {
        console.log("Minter:", record.minter);
    }

    if (record.declaration !== undefined) {
        console.log("Declaration:", record.declaration);
    }

    if (record.declaredTool !== undefined) {
        console.log("Declared Tool:", record.declaredTool);
    }

    if (record.licenseURI !== undefined) {
        console.log("License URI:", record.licenseURI);
    }

    if (record.disputed !== undefined) {
        console.log("Disputed:", record.disputed);
    }

    if (record.createdAt !== undefined) {
        console.log("Created At:", record.createdAt.toString());
    }

    console.log("==========================================");
}

main().catch((error) => {
    console.error("\nQUERY FAILED");
    console.error(error);
    process.exitCode = 1;
});