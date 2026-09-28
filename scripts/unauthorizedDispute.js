import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
    console.log("==============================================");
    console.log("UNAUTHORIZED DISPUTE TEST");
    console.log("==============================================");

    const deployment = JSON.parse(
        fs.readFileSync(
            path.resolve("evidence", "deployment.json"),
            "utf8"
        )
    );

    const rpc = deployment.rpc || "http://127.0.0.1:8545";
    const contractAddress = deployment.contractAddress;
    const tokenId = 1;

    const provider = new ethers.JsonRpcProvider(rpc);

    // Hardhat local account #1.
    // The private key is NOT stored in the project; this is supplied
    // only by the local Hardhat development node.
    const unauthorizedUser = await provider.getSigner(1);

    const unauthorizedAddress = await unauthorizedUser.getAddress();

    const contract = new ethers.Contract(
        contractAddress,
        [
            "function setDispute(uint256 tokenId, bool disputed)"
        ],
        unauthorizedUser
    );

    console.log("\nContract:", contractAddress);
    console.log("RPC:", rpc);
    console.log("Token ID:", tokenId);
    console.log("Unauthorized account:", unauthorizedAddress);

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
