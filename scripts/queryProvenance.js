import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
    console.error("ERROR: CONTRACT_ADDRESS environment variable is required.");
    process.exit(1);
}

const tokenId = process.argv[2] || "1";

const provider = new ethers.JsonRpcProvider(RPC_URL);

const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    [
        "function getProvenance(uint256 tokenId) view returns (tuple(bytes32 contentDigest, bytes32 metadataDigest, address creator, address minter, string declaration, string declaredTool, string licenseURI, bool disputed, uint256 createdAt))",
        "function ownerOf(uint256 tokenId) view returns (address)"
    ],
    provider
);

async function main() {
    console.log("==========================================");
    console.log("DIGITAL ASSET PROVENANCE");
    console.log("==========================================");
    console.log(`Contract : ${CONTRACT_ADDRESS}`);
    console.log(`RPC      : ${RPC_URL}`);
    console.log(`Token ID : ${tokenId}`);
    console.log();

    const provenance = await contract.getProvenance(tokenId);
    const owner = await contract.ownerOf(tokenId);

    console.log("PROVENANCE");
    console.log("------------------------------------------");
    console.log(`Content Digest  : ${provenance.contentDigest}`);
    console.log(`Metadata Digest : ${provenance.metadataDigest}`);
    console.log(`Creator         : ${provenance.creator}`);
    console.log(`Minter          : ${provenance.minter}`);
    console.log(`Declared Tool   : ${provenance.declaredTool}`);
    console.log(`Declaration     : ${provenance.declaration}`);
    console.log(`License URI     : ${provenance.licenseURI}`);
    console.log(`Disputed        : ${provenance.disputed}`);
    console.log(`Created At      : ${provenance.createdAt}`);

    console.log();
    console.log("CURRENT TOKEN OWNER");
    console.log("------------------------------------------");
    console.log(owner);

    console.log("==========================================");
}

main().catch((error) => {
    console.error("QUERY FAILED");
    console.error(error);
    process.exit(1);
});