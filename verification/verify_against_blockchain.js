import { ethers } from "ethers";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPLOYMENT_FILE = path.join(PROJECT_ROOT, "evidence", "deployment.json");

function loadDeployment() {
    if (!fs.existsSync(DEPLOYMENT_FILE)) {
        throw new Error(`Deployment evidence not found: ${DEPLOYMENT_FILE}`);
    }

    const data = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));

    if (!data.contractAddress) {
        throw new Error("deployment.json does not contain contractAddress.");
    }

    return {
        rpc: data.rpc || "http://127.0.0.1:8545",
        contractAddress: data.contractAddress,
    };
}

function calculateSHA256(filePath) {
    const fileBytes = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(fileBytes).digest("hex");
}

async function main() {
    const tokenId = process.argv[2];
    const suppliedFile = process.argv[3];

    if (!tokenId || !suppliedFile) {
        console.log(
            "Usage:\n" +
            "node verification\\verify_against_blockchain.js <tokenId> <filePath>"
        );
        process.exit(1);
    }

    const resolvedFile = path.resolve(suppliedFile);

    if (!fs.existsSync(resolvedFile)) {
        console.error(`ERROR: File not found: ${resolvedFile}`);
        process.exit(1);
    }

    const deployment = loadDeployment();

    const provider = new ethers.JsonRpcProvider(deployment.rpc);

    const contract = new ethers.Contract(
        deployment.contractAddress,
        [
            "function getProvenance(uint256 tokenId) view returns (tuple(bytes32 contentDigest, bytes32 metadataDigest, address creator, address minter, string declaration, string declaredTool, string licenseURI, bool disputed, uint256 createdAt))"
        ],
        provider
    );

    console.log("==============================================");
    console.log("BLOCKCHAIN-BACKED DIGITAL ASSET VERIFICATION");
    console.log("==============================================");
    console.log(`Contract: ${deployment.contractAddress}`);
    console.log(`RPC: ${deployment.rpc}`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Supplied file: ${resolvedFile}`);
    console.log();
    console.log("Reading committed provenance from blockchain...");

    const provenance = await contract.getProvenance(tokenId);

    const committedDigest = provenance.contentDigest;
    const metadataDigest = provenance.metadataDigest;
    const creator = provenance.creator;
    const minter = provenance.minter;
    const declaration = provenance.declaration;
    const declaredTool = provenance.declaredTool;
    const licenseURI = provenance.licenseURI;
    const disputed = provenance.disputed;
    const createdAt = provenance.createdAt;

    const suppliedDigest = "0x" + calculateSHA256(resolvedFile);

    console.log();
    console.log("ON-CHAIN PROVENANCE");
    console.log("----------------------------------------------");
    console.log(`Committed content digest: ${committedDigest}`);
    console.log(`Metadata digest         : ${metadataDigest}`);
    console.log(`Creator                 : ${creator}`);
    console.log(`Minter                  : ${minter}`);
    console.log(`Declaration             : ${declaration}`);
    console.log(`Declared tool           : ${declaredTool}`);
    console.log(`License URI             : ${licenseURI}`);
    console.log(`Disputed                : ${disputed}`);
    console.log(`Created at              : ${createdAt}`);

    console.log();
    console.log("INDEPENDENT FILE HASH");
    console.log("----------------------------------------------");
    console.log(`Supplied SHA-256        : ${suppliedDigest}`);
    console.log();

    if (committedDigest.toLowerCase() === suppliedDigest.toLowerCase()) {
        console.log("VERIFICATION RESULT: MATCH");
        console.log("The supplied bytes match the content digest committed on-chain.");
    } else {
        console.log("VERIFICATION RESULT: MISMATCH");
        console.log("The supplied bytes do NOT match the content digest committed on-chain.");
    }

    console.log("==============================================");
}

main().catch((error) => {
    console.error("VERIFICATION ERROR");
    console.error(error.message || error);
    process.exit(1);
});
