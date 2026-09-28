import hre from "hardhat";

async function main() {
    const { ethers } = await hre.network.connect();

    const [deployer] = await ethers.getSigners();

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

    const assets = [
        {
            assetId: "asset_001",
            contentDigest:
                "0x3fd09810957efa59b9b40cd6b05f0410d4196482aa9ee23e6bdaac41ba26ed67",
            metadataDigest:
                "0xa311a32b1363220acc2088be64f11e361525c4c215c3a6988b568b8e6b692f40"
        },
        {
            assetId: "asset_002",
            contentDigest:
                "0x6c4767000e48c37cee897c1c6965cab3a3188be778bf78facc66ef55bd643502",
            metadataDigest:
                "0xecbdb945f5d4b181cb5c5fe9c1598efe3fd176885068bbff18448f3599d222f4"
        }
    ];

    const declaration =
        "The minter declares that this asset is an AI-generated sample asset submitted for academic digital asset provenance demonstration. This declaration does not establish copyright ownership, originality, or legal entitlement.";

    const declaredTool = "Google Gemini";

    const licenseURI = "academic-demo-license";

    console.log("==============================================");
    console.log("DIGITAL ASSET PROVENANCE - MINT");
    console.log("==============================================");

    console.log("Contract:", contractAddress);
    console.log("Minter:", deployer.address);
    console.log();

    for (const asset of assets) {
        console.log("----------------------------------------------");
        console.log(`Minting ${asset.assetId}`);
        console.log("----------------------------------------------");

        console.log("Content digest:", asset.contentDigest);
        console.log("Metadata digest:", asset.metadataDigest);
        console.log("Declared tool:", declaredTool);

        console.log("\nSubmitting mint transaction...");

        const tx = await contract.mintAsset(
            deployer.address,
            asset.contentDigest,
            asset.metadataDigest,
            declaration,
            declaredTool,
            licenseURI
        );

        console.log("Transaction submitted:", tx.hash);

        const receipt = await tx.wait();

        console.log("Transaction confirmed.");
        console.log("Block number:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());

        for (const log of receipt.logs) {
            try {
                const parsed = contract.interface.parseLog({
                    topics: log.topics,
                    data: log.data
                });

                if (parsed && parsed.name === "AssetMinted") {
                    console.log("Event: AssetMinted");
                    console.log(
                        "Token ID:",
                        parsed.args.tokenId.toString()
                    );
                    console.log(
                        "Content digest:",
                        parsed.args.contentDigest
                    );
                    console.log(
                        "Metadata digest:",
                        parsed.args.metadataDigest
                    );
                }
            } catch {
                // Ignore unrelated logs.
            }
        }

        console.log();
    }

    console.log("==============================================");
    console.log("ALL ASSETS MINTED SUCCESSFULLY");
    console.log("==============================================");
}

main().catch((error) => {
    console.error("\nMINT FAILED");
    console.error(error.message || error);
    process.exitCode = 1;
});