import hre from "hardhat";

async function main() {
    console.log("==============================================");
    console.log("DEPLOYMENT TRANSACTION LOOKUP");
    console.log("==============================================");

    const { ethers } = await hre.network.connect();

    const contractAddress =
        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    const deploymentBlock = 1;

    const block = await ethers.provider.getBlock(
        deploymentBlock,
        true
    );

    if (!block) {
        throw new Error(
            `Block ${deploymentBlock} was not found.`
        );
    }

    console.log("\nContract:", contractAddress);
    console.log("Deployment block:", deploymentBlock);
    console.log("Block hash:", block.hash);

    console.log("\nTransactions in deployment block:");

    for (const tx of block.prefetchedTransactions) {
        console.log("\nTransaction hash:", tx.hash);
        console.log("From:", tx.from);
        console.log("To:", tx.to);
        console.log("Nonce:", tx.nonce);

        if (
            tx.to &&
            tx.to.toLowerCase() === contractAddress.toLowerCase()
        ) {
            console.log("\nMatched contract transaction.");
        }

        if (!tx.to) {
            console.log("Contract creation transaction detected.");
        }
    }

    console.log("\n==============================================");
    console.log("DEPLOYMENT LOOKUP COMPLETE");
    console.log("==============================================");
}

main().catch((error) => {
    console.error("\nLOOKUP FAILED");
    console.error(error);
    process.exitCode = 1;
});