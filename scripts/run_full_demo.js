import hre from "hardhat";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);

const MANIFEST_FILE = path.join(
    PROJECT_ROOT,
    "evidence",
    "day2_hashes.json"
);

const DEPLOYMENT_FILE = path.join(
    PROJECT_ROOT,
    "evidence",
    "deployment.json"
);

const FINAL_STATE_FILE = path.join(
    PROJECT_ROOT,
    "evidence",
    "final_blockchain_state.json"
);

const DEMO_EVIDENCE_FILE = path.join(
    PROJECT_ROOT,
    "evidence",
    "final_demo_evidence.json"
);

const TEST_RESULTS_FILE = path.join(
    PROJECT_ROOT,
    "evidence",
    "blockchain_test_results.json"
);

const RPC_URL = "http://127.0.0.1:8545";


/* ============================================================
   FILE / HASH HELPERS
   ============================================================ */

function sha256File(filePath) {
    return crypto
        .createHash("sha256")
        .update(fs.readFileSync(filePath))
        .digest("hex");
}


function loadManifest() {
    if (!fs.existsSync(MANIFEST_FILE)) {
        throw new Error(
            "day2_hashes.json not found. Run register_assets.py first."
        );
    }

    const manifest = JSON.parse(
        fs.readFileSync(MANIFEST_FILE, "utf8")
    );

    if (!Array.isArray(manifest) || manifest.length === 0) {
        throw new Error(
            "day2_hashes.json does not contain any assets."
        );
    }

    return manifest;
}


function getAssetPath(record) {
    return path.join(
        PROJECT_ROOT,
        record.assetFile.replace(/\//g, path.sep)
    );
}


function getMetadataPath(record) {
    return path.join(
        PROJECT_ROOT,
        record.metadataFile.replace(/\//g, path.sep)
    );
}


function loadMetadata(record) {
    const metadataPath = getMetadataPath(record);

    if (!fs.existsSync(metadataPath)) {
        throw new Error(
            `Metadata file not found: ${metadataPath}`
        );
    }

    return JSON.parse(
        fs.readFileSync(metadataPath, "utf8")
    );
}


/* ============================================================
   DEPLOYMENT
   ============================================================ */

async function deployContract(
    ethers,
    deployer,
    minter,
    moderator
) {
    console.log();
    console.log("1. DEPLOYING CONTRACT");
    console.log("----------------------------------------------");

    const DigitalAssetProvenance =
        await ethers.getContractFactory(
            "DigitalAssetProvenance"
        );

    const contract =
        await DigitalAssetProvenance.deploy(
            moderator.address
        );

    const deploymentTx =
        contract.deploymentTransaction();

    await contract.waitForDeployment();

    const contractAddress =
        await contract.getAddress();

    const receipt =
        await ethers.provider.getTransactionReceipt(
            deploymentTx.hash
        );

    const network =
        await ethers.provider.getNetwork();

    const deployment = {
        network: "Hardhat Localhost",
        chainId: Number(network.chainId),
        rpc: RPC_URL,
        contractAddress,
        deploymentTransaction: deploymentTx.hash,
        deploymentBlock: receipt.blockNumber,

        accounts: {
            deployer: deployer.address,
            minter: minter.address,
            moderator: moderator.address
        },

        compiler: {
            solidity: "0.8.34",
            hardhat: "3.18.0",
            openzeppelin: "5.6.1",
            ethers: "6.17.0"
        }
    };

    fs.writeFileSync(
        DEPLOYMENT_FILE,
        JSON.stringify(deployment, null, 2)
    );

    console.log("Contract:", contractAddress);
    console.log(
        "Deployment transaction:",
        deploymentTx.hash
    );
    console.log(
        "Deployment block:",
        receipt.blockNumber
    );

    return {
        contract,
        contractAddress,
        deploymentTx: deploymentTx.hash,
        deploymentBlock: receipt.blockNumber,
        deployment
    };
}


/* ============================================================
   MINT ALL REGISTERED ASSETS
   ============================================================ */

async function mintAssets(
    ethers,
    contract,
    deployer,
    manifest
) {
    console.log();
    console.log("2. MINTING ALL REGISTERED ASSETS");
    console.log("----------------------------------------------");

    const results = [];

    for (const record of manifest) {

        const metadata =
            loadMetadata(record);

        const contentDigest =
            "0x" + record.contentDigest;

        const metadataDigest =
            "0x" + record.metadataDigest;

        const declaration =
            metadata.description ||
            "Academic digital asset provenance demonstration.";

        const declaredTool =
            metadata.declaredTool ||
            "Unknown";

        const licenseURI =
            metadata.licenseURI ||
            "academic-demo-license";

        console.log();
        console.log(
            `Minting ${record.assetId}`
        );

        console.log(
            "Content digest:",
            contentDigest
        );

        console.log(
            "Metadata digest:",
            metadataDigest
        );

        console.log(
            "Declared tool:",
            declaredTool
        );

        const tx =
            await contract.mintAsset(
                deployer.address,
                contentDigest,
                metadataDigest,
                declaration,
                declaredTool,
                licenseURI
            );

        const receipt =
            await tx.wait();

        let tokenId = null;

        for (const log of receipt.logs) {

            try {

                const parsed =
                    contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });

                if (
                    parsed &&
                    parsed.name === "AssetMinted"
                ) {
                    tokenId =
                        parsed.args.tokenId.toString();

                    break;
                }

            } catch {
                // Ignore unrelated logs.
            }
        }

        if (tokenId === null) {
            throw new Error(
                `Could not obtain Token ID for ${record.assetId}.`
            );
        }

        results.push({
            assetId: record.assetId,
            tokenId,
            transaction: tx.hash,
            block: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            contentDigest,
            metadataDigest
        });

        console.log(
            `Token ID: ${tokenId}`
        );

        console.log(
            `Transaction: ${tx.hash}`
        );

        console.log(
            `Block: ${receipt.blockNumber}`
        );

        console.log(
            `Gas used: ${receipt.gasUsed}`
        );
    }

    return results;
}


/* ============================================================
   TRANSFER FIRST TOKEN
   ============================================================ */

async function transferFirstToken(
    contract,
    deployer,
    minter,
    firstTokenId
) {
    console.log();
    console.log("3. TRANSFERRING FIRST TOKEN");
    console.log("----------------------------------------------");

    const tx =
        await contract.transferFrom(
            deployer.address,
            minter.address,
            firstTokenId
        );

    const receipt =
        await tx.wait();

    console.log(
        "Token:",
        firstTokenId.toString()
    );

    console.log(
        "Transaction:",
        tx.hash
    );

    console.log(
        "Block:",
        receipt.blockNumber
    );

    console.log(
        "Gas used:",
        receipt.gasUsed.toString()
    );

    return {
        tokenId: firstTokenId.toString(),
        from: deployer.address,
        to: minter.address,
        transaction: tx.hash,
        block: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
    };
}


/* ============================================================
   MODERATOR DISPUTE
   ============================================================ */

async function setFirstTokenDispute(
    ethers,
    contractAddress,
    moderator,
    firstTokenId
) {
    console.log();
    console.log("4. SETTING MODERATOR DISPUTE");
    console.log("----------------------------------------------");

    const contract =
        await ethers.getContractAt(
            "DigitalAssetProvenance",
            contractAddress,
            moderator
        );

    const tx =
        await contract.setDispute(
            firstTokenId,
            true
        );

    const receipt =
        await tx.wait();

    console.log(
        "Token:",
        firstTokenId.toString()
    );

    console.log(
        "Transaction:",
        tx.hash
    );

    console.log(
        "Block:",
        receipt.blockNumber
    );

    console.log(
        "Gas used:",
        receipt.gasUsed.toString()
    );

    return {
        tokenId: firstTokenId.toString(),
        disputed: true,
        transaction: tx.hash,
        block: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
    };
}


/* ============================================================
   VERIFY EVERY ASSET
   ============================================================ */

async function verifyAssets(
    ethers,
    contractAddress,
    manifest,
    mintResults
) {
    console.log();
    console.log("5. VERIFYING ALL ASSETS AGAINST BLOCKCHAIN");
    console.log("----------------------------------------------");

    const contract =
        await ethers.getContractAt(
            "DigitalAssetProvenance",
            contractAddress
        );

    const results = [];

    for (const record of manifest) {

        const minted =
            mintResults.find(
                item =>
                    item.assetId === record.assetId
            );

        if (!minted) {
            throw new Error(
                `Mint result not found for ${record.assetId}`
            );
        }

        const tokenId =
            Number(minted.tokenId);

        const provenance =
            await contract.getProvenance(
                tokenId
            );

        const assetPath =
            getAssetPath(record);

        const suppliedDigest =
            "0x" +
            sha256File(assetPath);

        const committedDigest =
            provenance.contentDigest;

        const match =
            suppliedDigest.toLowerCase() ===
            committedDigest.toLowerCase();

        const result = {
            assetId: record.assetId,
            tokenId,

            file:
                record.assetFile,

            suppliedDigest,

            committedDigest,

            metadataDigest:
                provenance.metadataDigest,

            creator:
                provenance.creator,

            minter:
                provenance.minter,

            declaredTool:
                provenance.declaredTool,

            declaration:
                provenance.declaration,

            licenseURI:
                provenance.licenseURI,

            disputed:
                provenance.disputed,

            result:
                match
                    ? "MATCH"
                    : "MISMATCH"
        };

        results.push(result);

        console.log(
            `${record.assetId} | Token #${tokenId} | ${result.result}`
        );
    }

    return results;
}


/* ============================================================
   UNAUTHORIZED DISPUTE TEST
   ============================================================ */

async function unauthorizedDisputeTest(
    ethers,
    contractAddress,
    minter,
    firstTokenId
) {
    console.log();
    console.log("6. UNAUTHORIZED DISPUTE TEST");
    console.log("----------------------------------------------");

    const contract =
        await ethers.getContractAt(
            "DigitalAssetProvenance",
            contractAddress,
            minter
        );

    try {

        const tx =
            await contract.setDispute(
                firstTokenId,
                false
            );

        await tx.wait();

        console.log(
            "ERROR: Unauthorized update succeeded."
        );

        return {
            passed: false,
            result:
                "UNAUTHORIZED UPDATE SUCCEEDED"
        };

    } catch (error) {

        console.log(
            "Unauthorized dispute rejected as expected."
        );

        return {
            passed: true,
            result: "REJECTED"
        };
    }
}


/* ============================================================
   BUILD FINAL BLOCKCHAIN STATE
   ============================================================ */

async function buildFinalState(
    ethers,
    contractAddress,
    mintResults,
    deployment
) {
    console.log();
    console.log("7. BUILDING FINAL BLOCKCHAIN STATE");
    console.log("----------------------------------------------");

    const contract =
        await ethers.getContractAt(
            "DigitalAssetProvenance",
            contractAddress
        );

    const tokens = {};

    for (const item of mintResults) {

        const tokenId =
            Number(item.tokenId);

        const provenance =
            await contract.getProvenance(
                tokenId
            );

        const owner =
            await contract.ownerOf(
                tokenId
            );

        tokens[tokenId] = {

            owner,

            contentDigest:
                provenance.contentDigest,

            metadataDigest:
                provenance.metadataDigest,

            creator:
                provenance.creator,

            minter:
                provenance.minter,

            declaration:
                provenance.declaration,

            declaredTool:
                provenance.declaredTool,

            licenseURI:
                provenance.licenseURI,

            disputed:
                provenance.disputed,

            createdAt:
                provenance.createdAt.toString()
        };
    }

    const finalState = {

        generatedAt:
            new Date().toISOString(),

        network:
            deployment.network,

        chainId:
            deployment.chainId,

        rpc:
            deployment.rpc,

        contractAddress,

        deploymentTransaction:
            deployment.deploymentTransaction,

        deploymentBlock:
            deployment.deploymentBlock,

        accounts:
            deployment.accounts,

        compiler:
            deployment.compiler,

        tokens
    };

    fs.writeFileSync(
        FINAL_STATE_FILE,
        JSON.stringify(
            finalState,
            null,
            2
        )
    );

    return finalState;
}


/* ============================================================
   MAIN
   ============================================================ */

async function main() {

    console.log();
    console.log(
        "============================================================"
    );

    console.log(
        "DIGITAL ASSET PROVENANCE"
    );

    console.log(
        "FULL AUTOMATED PRACTICAL DEMO"
    );

    console.log(
        "============================================================"
    );

    const { ethers } =
        await hre.network.connect();

    const [
        deployer,
        minter,
        moderator
    ] =
        await ethers.getSigners();

    console.log();
    console.log("ACCOUNTS");
    console.log("----------------------------------------------");

    console.log(
        "Deployer :",
        deployer.address
    );

    console.log(
        "Minter   :",
        minter.address
    );

    console.log(
        "Moderator:",
        moderator.address
    );


    /* --------------------------------------------------------
       LOAD DYNAMIC ASSET MANIFEST
       -------------------------------------------------------- */

    const manifest =
        loadManifest();

    console.log();
    console.log(
        `Assets registered: ${manifest.length}`
    );


    /* --------------------------------------------------------
       DEPLOY
       -------------------------------------------------------- */

    const deployment =
        await deployContract(
            ethers,
            deployer,
            minter,
            moderator
        );


    /* --------------------------------------------------------
       MINT ALL
       -------------------------------------------------------- */

    const mintResults =
        await mintAssets(
            ethers,
            deployment.contract,
            deployer,
            manifest
        );


    if (mintResults.length === 0) {
        throw new Error(
            "No assets were minted."
        );
    }


    /* --------------------------------------------------------
       FIRST TOKEN DEMO
       -------------------------------------------------------- */

    const firstTokenId =
        BigInt(
            mintResults[0].tokenId
        );


    /* --------------------------------------------------------
       TRANSFER
       -------------------------------------------------------- */

    const transfer =
        await transferFirstToken(
            deployment.contract,
            deployer,
            minter,
            firstTokenId
        );


    /* --------------------------------------------------------
       DISPUTE
       -------------------------------------------------------- */

    const dispute =
        await setFirstTokenDispute(
            ethers,
            deployment.contractAddress,
            moderator,
            firstTokenId
        );


    /* --------------------------------------------------------
       VERIFY ALL
       -------------------------------------------------------- */

    const verification =
        await verifyAssets(
            ethers,
            deployment.contractAddress,
            manifest,
            mintResults
        );


    /* --------------------------------------------------------
       UNAUTHORIZED DISPUTE
       -------------------------------------------------------- */

    const unauthorized =
        await unauthorizedDisputeTest(
            ethers,
            deployment.contractAddress,
            minter,
            firstTokenId
        );


    /* --------------------------------------------------------
       FINAL STATE
       -------------------------------------------------------- */

    const finalState =
        await buildFinalState(
            ethers,
            deployment.contractAddress,
            mintResults,
            deployment.deployment
        );


    /* --------------------------------------------------------
       SUMMARY
       -------------------------------------------------------- */

    const allMatches =
        verification.length > 0 &&
        verification.every(
            item =>
                item.result === "MATCH"
        );


    const allMinted =
        mintResults.length ===
        manifest.length;


    const demoEvidence = {

        generatedAt:
            new Date().toISOString(),

        project:
            "Digital Asset Provenance",

        network:
            deployment.deployment.network,

        chainId:
            deployment.deployment.chainId,

        contractAddress:
            deployment.contractAddress,

        accounts:
            deployment.deployment.accounts,

        deployment: {

            transaction:
                deployment.deploymentTx,

            block:
                deployment.deploymentBlock
        },

        assets:
            mintResults,

        transfer,

        dispute,

        verification,

        securityTest:
            unauthorized,

        finalStateFile:
            "evidence/final_blockchain_state.json",

        summary: {

            assetsRegistered:
                manifest.length,

            assetsMinted:
                mintResults.length,

            mintingPassed:
                allMinted,

            assetVerificationPassed:
                allMatches,

            unauthorizedDisputeRejected:
                unauthorized.passed
        }
    };


    fs.writeFileSync(
        DEMO_EVIDENCE_FILE,
        JSON.stringify(
            demoEvidence,
            null,
            2
        )
    );


    /* --------------------------------------------------------
       TEST RESULTS
       -------------------------------------------------------- */

    const blockchainTests = {

        generatedAt:
            new Date().toISOString(),

        network:
            deployment.deployment.network,

        chainId:
            deployment.deployment.chainId,

        contractAddress:
            deployment.contractAddress,

        tests: {

            deployment:
                "PASS",

            minting:
                allMinted
                    ? "PASS"
                    : "FAIL",

            transfer:
                "PASS",

            moderatorDispute:
                "PASS",

            assetVerification:
                allMatches
                    ? "PASS"
                    : "FAIL",

            unauthorizedDispute:
                unauthorized.passed
                    ? "PASS"
                    : "FAIL"
        },

        counts: {

            registered:
                manifest.length,

            minted:
                mintResults.length,

            verified:
                verification.length,

            matched:
                verification.filter(
                    item =>
                        item.result === "MATCH"
                ).length
        }
    };


    fs.writeFileSync(
        TEST_RESULTS_FILE,
        JSON.stringify(
            blockchainTests,
            null,
            2
        )
    );


    /* ========================================================
       FINAL OUTPUT
       ======================================================== */

    console.log();
    console.log(
        "============================================================"
    );

    console.log(
        "FULL AUTOMATED DEMO COMPLETE"
    );

    console.log(
        "============================================================"
    );

    console.log();

    console.log(
        "Assets registered       :",
        manifest.length
    );

    console.log(
        "Assets minted           :",
        mintResults.length
    );

    console.log(
        "Asset verification      :",
        allMatches
            ? "PASS"
            : "FAIL"
    );

    console.log(
        "Unauthorized dispute    :",
        unauthorized.passed
            ? "PASS"
            : "FAIL"
    );

    console.log();

    console.log(
        "Generated automatically:"
    );

    console.log(
        "  evidence/deployment.json"
    );

    console.log(
        "  evidence/blockchain_test_results.json"
    );

    console.log(
        "  evidence/final_demo_evidence.json"
    );

    console.log(
        "  evidence/final_blockchain_state.json"
    );

    console.log();

    console.log(
        "============================================================"
    );
}


main().catch(error => {

    console.error();

    console.error(
        "AUTOMATED DEMO FAILED"
    );

    console.error(
        "----------------------------------------------"
    );

    console.error(
        error.message || error
    );

    process.exit(1);
});