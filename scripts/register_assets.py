import argparse
import hashlib
import json
from pathlib import Path
from datetime import datetime


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
METADATA_DIR = PROJECT_ROOT / "metadata"
EVIDENCE_DIR = PROJECT_ROOT / "evidence"

MANIFEST_FILE = EVIDENCE_DIR / "day2_hashes.json"


def sha256_file(file_path):
    hasher = hashlib.sha256()

    with open(file_path, "rb") as file:
        while chunk := file.read(1024 * 1024):
            hasher.update(chunk)

    return hasher.hexdigest()


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def load_existing_metadata(asset_id):
    metadata_file = METADATA_DIR / f"{asset_id}.json"

    if metadata_file.exists():
        try:
            return json.loads(
                metadata_file.read_text(encoding="utf-8")
            )
        except json.JSONDecodeError:
            pass

    return None


def create_metadata(asset_id, image_file, tool):
    existing = load_existing_metadata(asset_id)

    if existing:
        metadata = existing

        # Keep the important existing provenance information,
        # but make sure the file information is current.
        metadata["assetId"] = asset_id
        metadata["fileName"] = image_file.name
        metadata["assetType"] = "image/png"

        if tool:
            metadata["declaredTool"] = tool

    else:
        metadata = {
            "assetId": asset_id.upper().replace("_", "-"),
            "fileName": image_file.name,
            "assetType": "image/png",
            "creator": "Student",
            "generationMethod": "AI-generated digital artwork",
            "declaredTool": tool or "Unknown",
            "model": None,
            "description": (
                "Digital artwork created for academic digital "
                "asset provenance demonstration."
            ),
            "version": "1.0",
            "project": "Digital Asset Provenance",
            "provenancePurpose": (
                "NFT-based digital asset provenance verification"
            )
        }

    return metadata


def main():
    parser = argparse.ArgumentParser(
        description="Prepare digital assets for provenance registration."
    )

    parser.add_argument(
        "--tool",
        default="Google Gemini",
        help="Declared generation tool."
    )

    args = parser.parse_args()

    ASSETS_DIR.mkdir(exist_ok=True)
    METADATA_DIR.mkdir(exist_ok=True)
    EVIDENCE_DIR.mkdir(exist_ok=True)

    image_files = sorted(
        [
            file
            for file in ASSETS_DIR.iterdir()
            if file.is_file()
            and file.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]
            and not file.name.lower().startswith("provenance")
        ]
    )

    if not image_files:
        print("ERROR: No image files found in assets/")
        return

    records = []

    print("=" * 70)
    print("DIGITAL ASSET PREPARATION")
    print("=" * 70)

    for index, image_file in enumerate(image_files, start=1):

        asset_id = f"asset_{index:03d}"

        content_digest = sha256_file(image_file)

        metadata = create_metadata(
            asset_id,
            image_file,
            args.tool
        )

        metadata_file = METADATA_DIR / f"{asset_id}.json"

        metadata_text = json.dumps(
            metadata,
            indent=2,
            ensure_ascii=False
        )

        metadata_file.write_text(
            metadata_text,
            encoding="utf-8"
        )

        metadata_digest = sha256_bytes(
            metadata_text.encode("utf-8")
        )

        record = {
            "assetId": asset_id,
            "assetFile": str(
                image_file.relative_to(PROJECT_ROOT)
            ).replace("\\", "/"),
            "metadataFile": str(
                metadata_file.relative_to(PROJECT_ROOT)
            ).replace("\\", "/"),
            "hashAlgorithm": "SHA-256",
            "contentDigest": content_digest,
            "metadataDigest": metadata_digest
        }

        records.append(record)

        print()
        print(f"Asset: {asset_id}")
        print(f"File: {image_file.name}")
        print(f"Content SHA-256: {content_digest}")
        print(f"Metadata SHA-256: {metadata_digest}")

    MANIFEST_FILE.write_text(
        json.dumps(
            records,
            indent=2
        ),
        encoding="utf-8"
    )

    print()
    print("=" * 70)
    print("ASSET PREPARATION COMPLETE")
    print("=" * 70)
    print(f"Assets registered : {len(records)}")
    print(f"Manifest          : {MANIFEST_FILE}")
    print()
    print("Generated automatically:")
    print("  - metadata/*.json")
    print("  - evidence/day2_hashes.json")
    print("=" * 70)


if __name__ == "__main__":
    main()