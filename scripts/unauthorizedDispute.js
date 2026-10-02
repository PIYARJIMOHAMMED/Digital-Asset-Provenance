import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("==============================================");
    console.log("UNAUTHORIZED DISPUTE TEST");
    console.log("==============================================");

    const { ethers } = await hre.network.connect();
    const signers = await ethers.getSigners();

    const unauthorizedUser = signers[1];

    const deploymentPath = path.resolve(
        "evidence",
        "deployment.json"
    );

    const deployment = JSON.parse(
        fs.readFileSync(deploymentPath, "utf8")
    );

    const contractAddress = deployment.contractAddress;

    if (!contractAddress) {
        throw new Error("Contract address not found in deployment.json.");
    }

    const contract = await ethers.getContractAt(
        "DigitalAssetProvenance",
        contractAddress,
        unauthorizedUser
    );

    const tokenId = 1;

    console.log("\nContract:", contractAddress);
    console.log("Token ID:", tokenId);
    console.log("Unauthorized account:", unauthorizedUser.address);

    const currentDisputeStatus = await contract.isDisputed(tokenId);

    console.log("Current disputed status:", currentDisputeStatus);

    console.log("\nAttempting unauthorized dispute update...");

    try {
        const tx = await contract.setDispute(tokenId, false);
        await tx.wait();

        console.log("\nUNEXPECTED RESULT");
        console.log("Unauthorized transaction was accepted.");
        console.log("Transaction:", tx.hash);

        process.exitCode = 1;
    } catch (error) {
        console.log("\nTransaction rejected as expected.");

        if (error.reason) {
            console.log("Reason:", error.reason);
        } else if (error.shortMessage) {
            console.log("Reason:", error.shortMessage);
        } else {
            console.log("Reason: Access control rejected the transaction.");
        }

        console.log("\n==============================================");
        console.log("UNAUTHORIZED DISPUTE TEST PASSED");
        console.log("==============================================");
    }
}

main().catch((error) => {
    console.error("\nTEST FAILED");
    console.error(error.message || error);
    process.exitCode = 1;
});
