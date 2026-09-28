import hashlib
import json
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
EVIDENCE_FILE = BASE_DIR / "evidence" / "day2_hashes.json"


def calculate_sha256(file_path):
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        while chunk := file.read(8192):
            sha256.update(chunk)

    return sha256.hexdigest()


def load_evidence():
    with open(EVIDENCE_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def verify_asset(asset_id, supplied_file):
    records = load_evidence()

    record = next(
        (item for item in records if item["assetId"] == asset_id),
        None
    )

    if record is None:
        print(f"ERROR: No evidence found for {asset_id}")
        return

    supplied_path = Path(supplied_file)

    if not supplied_path.exists():
        print(f"ERROR: File not found: {supplied_path}")
        return

    committed_digest = record["contentDigest"]
    supplied_digest = calculate_sha256(supplied_path)

    print("=" * 70)
    print("DIGITAL ASSET VERIFICATION")
    print("=" * 70)

    print(f"Asset ID           : {asset_id}")
    print(f"Supplied file      : {supplied_path}")
    print(f"Committed digest   : {committed_digest}")
    print(f"Supplied digest    : {supplied_digest}")
    print()

    if committed_digest == supplied_digest:
        print("VERIFICATION RESULT: MATCH")
        print("The supplied asset matches the committed asset.")
    else:
        print("VERIFICATION RESULT: MISMATCH")
        print("The supplied asset does NOT match the committed asset.")

    print("=" * 70)


def main():
    if len(sys.argv) != 3:
        print(
            "Usage:\n"
            "python verification\\verify_asset.py "
            "<asset_id> <file_path>"
        )
        return

    asset_id = sys.argv[1]
    file_path = sys.argv[2]

    verify_asset(asset_id, file_path)


if __name__ == "__main__":
    main()