import hre from "hardhat";

async function main() {
    console.log("==============================================");
    console.log("TOKEN URI CHECK");
    console.log("==============================================");

    const { ethers } = await hre.network.connect();

    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is not set.");
    }

    const contract = await ethers.getContractAt(
        "DigitalAssetProvenance",
        contractAddress
    );

    for (const tokenId of [1, 2]) {
        console.log(`\nToken ${tokenId}`);

        try {
            const uri = await contract.tokenURI(tokenId);
            console.log("Token URI:", uri);
        } catch (error) {
            console.log(
                "Token URI unavailable:",
                error.shortMessage || error.message
            );
        }
    }

    console.log("\n==============================================");
    console.log("TOKEN URI CHECK COMPLETE");
    console.log("==============================================");
}

main().catch((error) => {
    console.error("\nURI CHECK FAILED");
    console.error(error);
    process.exitCode = 1;
});