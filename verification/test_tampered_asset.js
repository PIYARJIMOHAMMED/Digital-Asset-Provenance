import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);

const ORIGINAL_FILE = path.join(
    PROJECT_ROOT,
    "assets",
    "asset_001.png"
);

const TEMP_FILE = path.join(
    PROJECT_ROOT,
    "verification",
    "asset_001_tampered.png"
);

const VERIFY_SCRIPT = path.join(
    PROJECT_ROOT,
    "verification",
    "verify_against_blockchain.js"
);

console.log("================================================");
console.log("TAMPERED ASSET VERIFICATION TEST");
console.log("================================================");

try {
    if (!fs.existsSync(ORIGINAL_FILE)) {
        throw new Error(
            `Original asset not found: ${ORIGINAL_FILE}`
        );
    }

    console.log();
    console.log("Original asset:");
    console.log(ORIGINAL_FILE);

    // Copy original asset
    fs.copyFileSync(
        ORIGINAL_FILE,
        TEMP_FILE
    );

    console.log();
    console.log("Creating temporary tampered copy...");

    // Change the bytes
    fs.appendFileSync(
        TEMP_FILE,
        Buffer.from("TAMPERED_FOR_VERIFICATION_TEST")
    );

    console.log(
        "Temporary tampered file created."
    );

    console.log();
    console.log("Running blockchain verification...");
    console.log("----------------------------------------------");

    try {
        execFileSync(
            process.execPath,
            [
                VERIFY_SCRIPT,
                "1",
                TEMP_FILE
            ],
            {
                cwd: PROJECT_ROOT,
                stdio: "inherit"
            }
        );
    } catch {
        // The verifier itself should normally exit 0 even for MISMATCH.
        // This catch only prevents the cleanup from being skipped.
    }

    console.log();
    console.log("Cleaning up temporary file...");

} finally {
    if (fs.existsSync(TEMP_FILE)) {
        fs.unlinkSync(TEMP_FILE);
    }
}

console.log();
console.log(
    "Temporary tampered file deleted."
);

console.log();
console.log("================================================");
console.log("TAMPERED ASSET TEST COMPLETE");
console.log("================================================");