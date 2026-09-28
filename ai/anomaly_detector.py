import json
from pathlib import Path
from collections import Counter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
EVIDENCE_FILE = PROJECT_ROOT / "evidence" / "day2_hashes.json"
EVALUATION_FILE = PROJECT_ROOT / "ai" / "evaluation_cases.json"


def load_records():
    with open(EVIDENCE_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def detect_anomalies(records):
    anomalies = []

    content_digests = [record["contentDigest"] for record in records]
    metadata_digests = [record["metadataDigest"] for record in records]

    content_counts = Counter(content_digests)
    metadata_counts = Counter(metadata_digests)

    for record in records:
        if content_counts[record["contentDigest"]] > 1:
            anomalies.append({
                "assetId": record["assetId"],
                "type": "DUPLICATE_CONTENT_DIGEST",
                "message": "Content digest is shared by multiple assets."
            })

        if metadata_counts[record["metadataDigest"]] > 1:
            anomalies.append({
                "assetId": record["assetId"],
                "type": "DUPLICATE_METADATA_DIGEST",
                "message": "Metadata digest is shared by multiple assets."
            })

    return anomalies


def evaluate_rule(records):
    """Small deterministic rule evaluation using synthetic positive/negative cases.

    This is a rule-unit evaluation, not a machine-learning benchmark.
    """
    cases = [
        {
            "name": "clean_sample",
            "records": records,
            "expected": False,
        },
        {
            "name": "synthetic_duplicate_content",
            "records": records + [{
                "assetId": "synthetic_duplicate",
                "contentDigest": records[0]["contentDigest"],
                "metadataDigest": "synthetic-unique-metadata-digest",
            }],
            "expected": True,
        },
    ]

    results = []
    correct = 0

    for case in cases:
        detected = len(detect_anomalies(case["records"])) > 0
        passed = detected == case["expected"]
        correct += int(passed)

        results.append({
            "case": case["name"],
            "expectedAnomaly": case["expected"],
            "detectedAnomaly": detected,
            "result": "PASS" if passed else "FAIL",
        })

    accuracy = correct / len(cases) if cases else 0.0
    return results, accuracy


def main():
    records = load_records()
    anomalies = detect_anomalies(records)
    evaluation, accuracy = evaluate_rule(records)

    print("=" * 70)
    print("AI / ANOMALY ANALYSIS")
    print("=" * 70)
    print("Method: rule-based duplicate content/metadata digest detection")
    print(f"Assets analyzed: {len(records)}")
    print(f"Anomalies detected: {len(anomalies)}")

    if not anomalies:
        print("Current sample result: NO ANOMALIES")
    else:
        for anomaly in anomalies:
            print(
                f"{anomaly['assetId']} | "
                f"{anomaly['type']} | "
                f"{anomaly['message']}"
            )

    print()
    print("RULE EVALUATION")
    print("-" * 70)
    for result in evaluation:
        print(
            f"{result['case']} | "
            f"expected={result['expectedAnomaly']} | "
            f"detected={result['detectedAnomaly']} | "
            f"{result['result']}"
        )

    print(f"Evaluation accuracy: {accuracy * 100:.1f}%")
    print("Evaluation type: deterministic rule-unit test on synthetic cases.")
    print("This is not a trained machine-learning model benchmark.")
    print("=" * 70)


if __name__ == "__main__":
    main()
