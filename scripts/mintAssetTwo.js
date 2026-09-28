import hre from "hardhat";

async function main() {
    console.log("==============================================");
    console.log("DIGITAL ASSET MINT - ASSET 002");
    console.log("==============================================");

    const { ethers } = await hre.network.connect();

    const [minter] = await ethers.getSigners();

    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is not set.");
    }

    const contract = await ethers.getContractAt(
        "DigitalAssetProvenance",
        contractAddress,
        minter
    );

    const creator = minter.address;

    const contentDigest =
        "0x7d31b62b3188fba6486542b52055de5d436792bf3796c4d912795a1452618375";

    const metadataDigest =
        "0xee6463eda0c682b8538a1e598aa4c4065b3d614a810babe528d640da8d8127f4";

    const declaration =
        "The minter declares that this asset is an original or permitted sample asset for academic provenance demonstration.";

    const declaredTool =
        "Student-created sample asset";

    const licenseURI =
        "academic-demo-license";

    console.log("\nContract:", contractAddress);
    console.log("Minter:", minter.address);
    console.log("Creator:", creator);
    console.log("Asset: asset_002");

    console.log("\nSubmitting mint transaction...");

    const tx = await contract.mintAsset(
        creator,
        contentDigest,
        metadataDigest,
        declaration,
        declaredTool,
        licenseURI
    );

    console.log("Transaction submitted:", tx.hash);

    const receipt = await tx.wait();

    console.log("\nTransaction confirmed.");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    console.log("\nTransaction logs:");

    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog(log);

            if (parsed && parsed.name === "AssetMinted") {
                console.log("Event: AssetMinted");
                console.log("Token ID:", parsed.args.tokenId.toString());
                console.log("Content digest:", parsed.args.contentDigest);
                console.log("Metadata digest:", parsed.args.metadataDigest);
            }
        } catch {
            // Ignore logs that do not belong to the contract interface.
        }
    }

    console.log("\n==============================================");
    console.log("ASSET 002 MINT COMPLETE");
    console.log("==============================================");
}

main().catch((error) => {
    console.error("\nASSET 002 MINT FAILED");
    console.error(error);
    process.exitCode = 1;
});