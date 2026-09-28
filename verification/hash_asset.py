import hashlib
import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent

ASSETS_DIR = PROJECT_ROOT / "assets"
METADATA_DIR = PROJECT_ROOT / "metadata"
EVIDENCE_DIR = PROJECT_ROOT / "evidence"

EVIDENCE_DIR.mkdir(exist_ok=True)


def calculate_sha256(file_path):
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        while True:
            chunk = file.read(8192)

            if not chunk:
                break

            sha256.update(chunk)

    return sha256.hexdigest()


def create_asset_record(asset_id):
    asset_file = ASSETS_DIR / f"{asset_id}.svg"
    metadata_file = METADATA_DIR / f"{asset_id}.json"

    if not asset_file.exists():
        raise FileNotFoundError(f"Asset not found: {asset_file}")

    if not metadata_file.exists():
        raise FileNotFoundError(
            f"Metadata not found: {metadata_file}"
        )

    content_digest = calculate_sha256(asset_file)
    metadata_digest = calculate_sha256(metadata_file)

    return {
        "assetId": asset_id,
        "assetFile": str(asset_file.relative_to(PROJECT_ROOT)),
        "metadataFile": str(metadata_file.relative_to(PROJECT_ROOT)),
        "hashAlgorithm": "SHA-256",
        "contentDigest": content_digest,
        "metadataDigest": metadata_digest
    }


def main():
    asset_ids = [
        "asset_001",
        "asset_002"
    ]

    records = []

    for asset_id in asset_ids:
        record = create_asset_record(asset_id)
        records.append(record)

        print("=" * 70)
        print(f"Asset: {record['assetId']}")
        print(f"Content Digest : {record['contentDigest']}")
        print(f"Metadata Digest: {record['metadataDigest']}")

    output_file = EVIDENCE_DIR / "day2_hashes.json"

    with open(output_file, "w", encoding="utf-8") as file:
        json.dump(
            records,
            file,
            indent=2
        )

    print("=" * 70)
    print(f"Hash evidence saved to: {output_file}")


if __name__ == "__main__":
    main()