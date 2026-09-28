import streamlit as st
import hashlib
import json
from pathlib import Path
from collections import Counter

# ============================================================
# DIGITAL ASSET PROVENANCE
# Professional Academic Demonstration Dashboard
# ============================================================

st.set_page_config(
    page_title="Digital Asset Provenance",
    page_icon="🔗",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ============================================================
# PROJECT PATHS
# ============================================================

ROOT = Path(__file__).resolve().parent.parent

ASSETS = ROOT / "assets"
EVIDENCE = ROOT / "evidence"
METADATA = ROOT / "metadata"
AI_DIR = ROOT / "ai"

DEPLOYMENT_FILE = EVIDENCE / "deployment.json"
DEMO_FILE = EVIDENCE / "final_demo_evidence.json"
FINAL_STATE_FILE = EVIDENCE / "final_blockchain_state.json"
TEST_RESULTS_FILE = EVIDENCE / "blockchain_test_results.json"
MANIFEST_FILE = EVIDENCE / "day2_hashes.json"
AI_EVALUATION_FILE = AI_DIR / "evaluation_cases.json"


# ============================================================
# HELPERS
# ============================================================

def read_json(file_path):
    """Safely read a JSON file."""
    try:
        if not file_path.exists():
            return None

        return json.loads(
            file_path.read_text(encoding="utf-8")
        )

    except Exception:
        return None


def sha256(data: bytes) -> str:
    """Calculate SHA-256 for supplied bytes."""
    return hashlib.sha256(data).hexdigest()


def short(value, length=22):
    """Shorten long blockchain values for display."""
    if not value:
        return "N/A"

    value = str(value)

    if len(value) <= length:
        return value

    return value[:length] + "..."


def load_manifest():
    data = read_json(MANIFEST_FILE)

    if isinstance(data, list):
        return data

    return []


def load_deployment():
    data = read_json(DEPLOYMENT_FILE)

    if isinstance(data, dict):
        return data

    return {}


def load_demo():
    data = read_json(DEMO_FILE)

    if isinstance(data, dict):
        return data

    return {}


def load_final_state():
    data = read_json(FINAL_STATE_FILE)

    if isinstance(data, dict):
        return data

    return {}


def load_test_results():
    data = read_json(TEST_RESULTS_FILE)

    if isinstance(data, dict):
        return data

    return {}


def load_metadata(metadata_file):
    path = ROOT / metadata_file

    data = read_json(path)

    if isinstance(data, dict):
        return data

    return {}


# ============================================================
# LOAD CURRENT PROJECT EVIDENCE
# ============================================================

deployment = load_deployment()
demo = load_demo()
final_state = load_final_state()
test_results = load_test_results()
manifest = load_manifest()

contract_address = deployment.get(
    "contractAddress",
    "Deployment not available"
)

network = deployment.get(
    "network",
    "Hardhat Localhost"
)

chain_id = deployment.get(
    "chainId",
    31337
)

rpc = deployment.get(
    "rpc",
    "http://127.0.0.1:8545"
)

deployment_tx = deployment.get(
    "deploymentTransaction",
    "N/A"
)

deployment_block = deployment.get(
    "deploymentBlock",
    "N/A"
)

accounts = deployment.get(
    "accounts",
    {}
)

compiler = deployment.get(
    "compiler",
    {}
)

deployer_address = accounts.get(
    "deployer",
    "N/A"
)

minter_address = accounts.get(
    "minter",
    "N/A"
)

moderator_address = accounts.get(
    "moderator",
    "N/A"
)


# ============================================================
# BUILD CURRENT ASSET DATA FROM EVIDENCE
# ============================================================

ASSET_DATA = {}

for record in manifest:

    asset_id = record.get("assetId")

    if not asset_id:
        continue

    token_id = None

    # Find corresponding minted token from final demo evidence.
    demo_assets = demo.get("assets", [])

    for item in demo_assets:

        if item.get("assetId") == asset_id:

            token_id = str(
                item.get("tokenId")
            )

            break

    # Fallback to asset order if required.
    if token_id is None:
        token_id = str(
            len(ASSET_DATA) + 1
        )

    metadata_file = record.get(
        "metadataFile",
        ""
    )

    metadata = load_metadata(
        metadata_file
    ) if metadata_file else {}

    # Find final blockchain state.
    blockchain_token = {}

    final_tokens = final_state.get(
        "tokens",
        {}
    )

    if token_id in final_tokens:
        blockchain_token = final_tokens[token_id]

    ASSET_DATA[token_id] = {
        "assetId": asset_id,
        "name": f"Asset {asset_id.replace('asset_', '')}",
        "file": record.get(
            "assetFile",
            "Unknown"
        ),
        "assetPath": record.get(
            "assetFile",
            ""
        ),
        "content": record.get(
            "contentDigest",
            ""
        ),
        "metadata": record.get(
            "metadataDigest",
            ""
        ),
        "metadataFile": metadata_file,
        "description": metadata.get(
            "description",
            "AI-generated sample asset for academic provenance demonstration."
        ),
        "declaredTool": metadata.get(
            "declaredTool",
            "Google Gemini"
        ),
        "licenseURI": blockchain_token.get(
            "licenseURI",
            metadata.get(
                "licenseURI",
                "academic-demo-license"
            )
        ),
        "owner": blockchain_token.get(
            "owner",
            "N/A"
        ),
        "creator": blockchain_token.get(
            "creator",
            deployer_address
        ),
        "minter": blockchain_token.get(
            "minter",
            deployer_address
        ),
        "disputed": blockchain_token.get(
            "disputed",
            False
        ),
        "createdAt": blockchain_token.get(
            "createdAt",
            "N/A"
        ),
        "tokenId": token_id,
    }


# ============================================================
# TRANSACTION DATA
# ============================================================

TRANSACTIONS = []

if deployment_tx and deployment_tx != "N/A":

    TRANSACTIONS.append(
        {
            "operation": "Deployment",
            "transaction": deployment_tx,
            "block": deployment_block,
            "gas": "Recorded on local chain",
        }
    )


for asset in demo.get("assets", []):

    TRANSACTIONS.append(
        {
            "operation": f"Mint {asset.get('assetId', 'Asset')}"
            f" — Token #{asset.get('tokenId', '?')}",
            "transaction": asset.get(
                "transaction",
                "N/A"
            ),
            "block": asset.get(
                "block",
                "N/A"
            ),
            "gas": asset.get(
                "gasUsed",
                "N/A"
            ),
        }
    )


transfer = demo.get(
    "transfer",
    {}
)

if transfer:

    TRANSACTIONS.append(
        {
            "operation": "Transfer Token #"
            + str(
                transfer.get(
                    "tokenId",
                    "?"
                )
            ),
            "transaction": transfer.get(
                "transaction",
                "N/A"
            ),
            "block": transfer.get(
                "block",
                "N/A"
            ),
            "gas": transfer.get(
                "gasUsed",
                "N/A"
            ),
        }
    )


dispute = demo.get(
    "dispute",
    {}
)

if dispute:

    TRANSACTIONS.append(
        {
            "operation": "Moderator Dispute Token #"
            + str(
                dispute.get(
                    "tokenId",
                    "?"
                )
            ),
            "transaction": dispute.get(
                "transaction",
                "N/A"
            ),
            "block": dispute.get(
                "block",
                "N/A"
            ),
            "gas": dispute.get(
                "gasUsed",
                "N/A"
            ),
        }
    )


# ============================================================
# VERIFICATION DATA
# ============================================================

verification_results = demo.get(
    "verification",
    []
)

security_test = demo.get(
    "securityTest",
    {}
)

all_matches = (
    len(verification_results) > 0
    and all(
        item.get("result") == "MATCH"
        for item in verification_results
    )
)

unauthorized_passed = security_test.get(
    "passed",
    False
)


# ============================================================
# AI ANALYSIS
# ============================================================

def run_ai_analysis():

    records = manifest

    anomalies = []

    content_digests = [
        record.get("contentDigest")
        for record in records
    ]

    metadata_digests = [
        record.get("metadataDigest")
        for record in records
    ]

    content_counts = Counter(
        content_digests
    )

    metadata_counts = Counter(
        metadata_digests
    )

    for record in records:

        content_digest = record.get(
            "contentDigest"
        )

        metadata_digest = record.get(
            "metadataDigest"
        )

        if content_counts[content_digest] > 1:

            anomalies.append(
                {
                    "assetId": record.get(
                        "assetId"
                    ),
                    "type":
                        "DUPLICATE_CONTENT_DIGEST",
                    "message":
                        "Content digest is shared by multiple assets.",
                }
            )

        if metadata_counts[metadata_digest] > 1:

            anomalies.append(
                {
                    "assetId": record.get(
                        "assetId"
                    ),
                    "type":
                        "DUPLICATE_METADATA_DIGEST",
                    "message":
                        "Metadata digest is shared by multiple assets.",
                }
            )

    evaluation_cases = [
        {
            "name": "clean_sample",
            "records": records,
            "expected": False,
        },
        {
            "name": "synthetic_duplicate_content",
            "records": records
            + (
                [
                    {
                        "assetId":
                            "synthetic_duplicate",
                        "contentDigest":
                            records[0].get(
                                "contentDigest"
                            )
                            if records
                            else "synthetic",
                        "metadataDigest":
                            "synthetic-unique-metadata-digest",
                    }
                ]
                if records
                else []
            ),
            "expected": True,
        },
    ]

    evaluation = []
    correct = 0

    for case in evaluation_cases:

        case_records = case["records"]

        content_values = [
            item.get("contentDigest")
            for item in case_records
        ]

        metadata_values = [
            item.get("metadataDigest")
            for item in case_records
        ]

        content_counter = Counter(
            content_values
        )

        metadata_counter = Counter(
            metadata_values
        )

        detected = False

        for item in case_records:

            if (
                content_counter[
                    item.get("contentDigest")
                ] > 1
            ):
                detected = True

            if (
                metadata_counter[
                    item.get("metadataDigest")
                ] > 1
            ):
                detected = True

        passed = (
            detected == case["expected"]
        )

        if passed:
            correct += 1

        evaluation.append(
            {
                "case": case["name"],
                "expected": case["expected"],
                "detected": detected,
                "result":
                    "PASS" if passed else "FAIL",
            }
        )

    accuracy = (
        correct / len(evaluation)
        if evaluation
        else 0
    )

    return (
        anomalies,
        evaluation,
        accuracy
    )


ai_anomalies, ai_evaluation, ai_accuracy = (
    run_ai_analysis()
)


# ============================================================
# PROFESSIONAL STYLING
# ============================================================

st.markdown(
    """
    <style>

    .stApp {
        background: #0b0f14;
    }

    .block-container {
        max-width: 1180px;
        padding-top: 2.2rem;
        padding-bottom: 4rem;
    }

    [data-testid="stSidebar"] {
        background: #10151c;
        border-right: 1px solid #252c35;
    }

    .hero {
        padding: 6px 0 26px 0;
    }

    .hero h1 {
        color: #f5f7fa;
        font-size: 2.25rem;
        margin: 0;
        font-weight: 760;
        letter-spacing: -0.02em;
    }

    .hero p {
        color: #8f9aaa;
        font-size: 1rem;
        margin-top: 8px;
    }

    .section {
        color: #f1f4f8;
        font-size: 1.28rem;
        font-weight: 720;
        margin: 28px 0 12px 0;
    }

    .muted {
        color: #8f9aaa;
    }

    .card {
        background: #121820;
        border: 1px solid #252e39;
        border-radius: 12px;
        padding: 17px;
        margin-bottom: 12px;
    }

    .label {
        color: #7f8b9b;
        font-size: .76rem;
        text-transform: uppercase;
        letter-spacing: .06em;
        font-weight: 700;
    }

    .value {
        color: #f4f6f8;
        font-size: 1.08rem;
        font-weight: 700;
        margin-top: 5px;
        word-break: break-word;
    }

    .hash {
        background: #0d1218;
        border: 1px solid #27313d;
        border-radius: 9px;
        padding: 12px;
        font-family: Consolas, monospace;
        color: #cbd4df;
        font-size: .78rem;
        word-break: break-all;
        line-height: 1.5;
    }

    .verify {
        border-radius: 13px;
        padding: 24px;
        margin: 16px 0;
    }

    .match {
        background: #102b20;
        border: 1px solid #277a56;
    }

    .mismatch {
        background: #32191e;
        border: 1px solid #a83f4d;
    }

    .verify-title {
        color: white;
        font-size: 1.55rem;
        font-weight: 800;
    }

    .verify-text {
        color: #c6ced8;
        margin-top: 6px;
        line-height: 1.5;
    }

    .rule {
        height: 1px;
        background: #252d37;
        margin: 30px 0;
    }

    .step {
        background: #121820;
        border: 1px solid #252e39;
        border-radius: 10px;
        padding: 15px;
        height: 100%;
    }

    .step-number {
        color: #7aa7ff;
        font-weight: 800;
        font-size: .75rem;
    }

    .step-title {
        color: #f2f5f8;
        font-weight: 700;
        margin-top: 4px;
    }

    .step-text {
        color: #8f9aaa;
        font-size: .83rem;
        margin-top: 5px;
    }

    .small {
        color: #8f9aaa;
        font-size: .82rem;
    }

    footer {
        visibility: hidden;
    }

    </style>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# SIDEBAR
# ============================================================

st.sidebar.markdown(
    "## 🔗 Digital Asset Provenance"
)

st.sidebar.caption(
    "Academic Demonstration"
)

st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Pages",
    [
        "Overview",
        "Technology",
        "Assets & Verification",
        "Blockchain Evidence",
        "AI Analysis",
    ],
)

st.sidebar.markdown("---")

st.sidebar.caption(
    "Local blockchain"
)

st.sidebar.code(
    f"{network}\n"
    f"Chain ID: {chain_id}\n"
    f"RPC: {rpc}",
    language="text",
)

st.sidebar.markdown("---")

if contract_address != "Deployment not available":

    st.sidebar.caption(
        "Current Contract"
    )

    st.sidebar.code(
        contract_address,
        language="text"
    )


# ============================================================
# OVERVIEW
# ============================================================

if page == "Overview":

    st.markdown(
        """
        <div class="hero">
            <h1>Digital Asset Provenance</h1>
            <p>
                Blockchain-backed integrity verification
                for AI-generated digital assets.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    c1, c2, c3, c4 = st.columns(4)

    with c1:

        st.markdown(
            """
            <div class="card">
                <div class="label">Blockchain</div>
                <div class="value">Hardhat Localhost</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c2:

        st.markdown(
            """
            <div class="card">
                <div class="label">Standard</div>
                <div class="value">ERC-721</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:

        st.markdown(
            """
            <div class="card">
                <div class="label">Integrity</div>
                <div class="value">SHA-256</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c4:

        st.markdown(
            f"""
            <div class="card">
                <div class="label">Registered Assets</div>
                <div class="value">{len(ASSET_DATA)}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown(
        '<div class="section">Project Status</div>',
        unsafe_allow_html=True,
    )

    c1, c2, c3, c4 = st.columns(4)

    with c1:

        st.metric(
            "Assets Minted",
            len(demo.get("assets", []))
        )

    with c2:

        st.metric(
            "Verification",
            "PASS" if all_matches else "CHECK"
        )

    with c3:

        st.metric(
            "Unauthorized Dispute",
            "PASS"
            if unauthorized_passed
            else "CHECK"
        )

    with c4:

        st.metric(
            "AI Evaluation",
            f"{ai_accuracy * 100:.0f}%"
        )

    st.markdown(
        '<div class="section">What the project does</div>',
        unsafe_allow_html=True,
    )

    st.write(
        "The system creates an NFT-style provenance record "
        "for an off-chain digital asset. The blockchain stores "
        "cryptographic commitments and provenance information, "
        "while the original digital asset remains off-chain."
    )

    st.markdown(
        '<div class="section">Verification principle</div>',
        unsafe_allow_html=True,
    )

    steps = [
        (
            "01",
            "Digital Asset",
            "AI-generated or student-created asset."
        ),
        (
            "02",
            "SHA-256",
            "Calculate the content digest."
        ),
        (
            "03",
            "Blockchain",
            "Commit the digest with provenance."
        ),
        (
            "04",
            "Independent Verification",
            "Compare supplied bytes with the committed digest."
        ),
    ]

    cols = st.columns(4)

    for col, (num, title, description) in zip(
        cols,
        steps
    ):

        with col:

            st.markdown(
                f"""
                <div class="step">
                    <div class="step-number">{num}</div>
                    <div class="step-title">{title}</div>
                    <div class="step-text">{description}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.markdown(
        '<div class="section">Important limitation</div>',
        unsafe_allow_html=True,
    )

    st.warning(
        "A matching SHA-256 digest proves that the supplied "
        "bytes match the bytes committed on-chain. It does not "
        "by itself prove copyright ownership, originality, legal "
        "entitlement, source authenticity, or the truth of a declaration."
    )


# ============================================================
# TECHNOLOGY
# ============================================================

elif page == "Technology":

    st.markdown(
        """
        <div class="hero">
            <h1>Technology</h1>
            <p>
                Core technologies used in the implementation.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    technologies = [
        (
            "Solidity 0.8.34",
            "Smart contract and provenance logic."
        ),
        (
            "OpenZeppelin 5.6.1",
            "ERC-721 and AccessControl components."
        ),
        (
            "Hardhat 3.18.0",
            "Local Ethereum-compatible blockchain and testing."
        ),
        (
            "ethers.js 6.17.0",
            "Blockchain interaction and transaction handling."
        ),
        (
            "SHA-256",
            "Cryptographic content and metadata digest."
        ),
        (
            "Python 3.10.9",
            "Verification and anomaly-detection utilities."
        ),
        (
            "Streamlit",
            "Academic demonstration dashboard."
        ),
        (
            "Mocha",
            "Automated smart-contract testing."
        ),
        (
            "Google Gemini",
            "Declared AI generation tool for the sample assets."
        ),
    ]

    for name, purpose in technologies:

        st.markdown(
            f"""
            <div class="card">
                <div class="label">{name}</div>
                <div class="value">{purpose}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown(
        '<div class="section">Architecture</div>',
        unsafe_allow_html=True,
    )

    st.code(
        """
AI-Generated Digital Asset
          ↓
      SHA-256
          ↓
Off-Chain Asset + Metadata
          ↓
Solidity Provenance Contract
          ↓
       ERC-721 NFT
          ↓
Content Digest + Metadata Digest
+ Creator + Minter + Declaration
+ Declared Tool + License + Dispute
          ↓
Independent Verification
          ↓
MATCH / MISMATCH
        """,
        language="text",
    )

    st.markdown(
        '<div class="section">Current contract</div>',
        unsafe_allow_html=True,
    )

    st.code(
        contract_address
    )


# ============================================================
# ASSETS & VERIFICATION
# ============================================================

elif page == "Assets & Verification":

    st.markdown(
        """
        <div class="hero">
            <h1>Assets & Verification</h1>
            <p>
                Independently verify supplied file bytes against
                the current blockchain commitments.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if not ASSET_DATA:

        st.error(
            "No asset evidence was found. "
            "Run the asset registration and blockchain demo first."
        )

    else:

        asset_choice = st.selectbox(
            "Select Asset",
            list(ASSET_DATA.keys()),
            format_func=lambda token:
                f"Token #{token} — "
                f"{ASSET_DATA[token]['file']}",
        )

        asset = ASSET_DATA[
            asset_choice
        ]

        c1, c2, c3 = st.columns(3)

        with c1:

            st.markdown(
                f"""
                <div class="card">
                    <div class="label">Asset</div>
                    <div class="value">
                        {asset["name"]}
                    </div>
                    <div class="small">
                        {asset["file"]}
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with c2:

            st.markdown(
                f"""
                <div class="card">
                    <div class="label">Token</div>
                    <div class="value">
                        #{asset["tokenId"]}
                    </div>
                    <div class="small">
                        Owner: {short(asset["owner"])}
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with c3:

            status = (
                "DISPUTED"
                if asset["disputed"]
                else "NOT DISPUTED"
            )

            st.markdown(
                f"""
                <div class="card">
                    <div class="label">Dispute Status</div>
                    <div class="value">
                        {status}
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.markdown(
            '<div class="section">On-Chain Commitment</div>',
            unsafe_allow_html=True,
        )

        st.markdown(
            '<div class="label">Content Digest</div>',
            unsafe_allow_html=True,
        )

        st.markdown(
            f'<div class="hash">{asset["content"]}</div>',
            unsafe_allow_html=True,
        )

        st.markdown(
            '<div class="label" style="margin-top:12px;">'
            'Metadata Digest</div>',
            unsafe_allow_html=True,
        )

        st.markdown(
            f'<div class="hash">{asset["metadata"]}</div>',
            unsafe_allow_html=True,
        )

        st.markdown(
            '<div class="section">Provenance</div>',
            unsafe_allow_html=True,
        )

        c1, c2 = st.columns(2)

        with c1:

            st.write(
                "**Creator:**",
                asset["creator"]
            )

            st.write(
                "**Minter:**",
                asset["minter"]
            )

            st.write(
                "**Declared Tool:**",
                asset["declaredTool"]
            )

        with c2:

            st.write(
                "**License URI:**",
                asset["licenseURI"]
            )

            st.write(
                "**Token Owner:**",
                asset["owner"]
            )

            st.write(
                "**Created At:**",
                asset["createdAt"]
            )

        st.markdown(
            '<div class="section">Verify Supplied File</div>',
            unsafe_allow_html=True,
        )

        st.info(
            "Upload the original asset to obtain MATCH. "
            "Upload an edited version to demonstrate MISMATCH. "
            "The filename itself does not affect SHA-256."
        )

        uploaded = st.file_uploader(
            "Upload file for independent verification",
            type=[
                "png",
                "jpg",
                "jpeg",
                "webp",
                "svg",
                "json",
                "txt",
            ],
            key=f"verify_{asset_choice}",
        )

        if uploaded is not None:

            file_bytes = uploaded.getvalue()

            supplied_hash = sha256(
                file_bytes
            )

            committed_hash = (
                asset["content"]
            )

            st.markdown(
                '<div class="section">Verification Details</div>',
                unsafe_allow_html=True,
            )

            c1, c2 = st.columns(2)

            with c1:

                st.markdown(
                    '<div class="label">'
                    'Supplied Filename</div>',
                    unsafe_allow_html=True,
                )

                st.markdown(
                    f'<div class="value">'
                    f'{uploaded.name}'
                    f'</div>',
                    unsafe_allow_html=True,
                )

            with c2:

                st.markdown(
                    '<div class="label">'
                    'File Size</div>',
                    unsafe_allow_html=True,
                )

                st.markdown(
                    f'<div class="value">'
                    f'{len(file_bytes):,} bytes'
                    f'</div>',
                    unsafe_allow_html=True,
                )

            st.markdown(
                '<div class="label" '
                'style="margin-top:15px;">'
                'SHA-256 of supplied file'
                '</div>',
                unsafe_allow_html=True,
            )

            st.markdown(
                f'<div class="hash">'
                f'{supplied_hash}'
                f'</div>',
                unsafe_allow_html=True,
            )

            st.markdown(
                '<div class="label" '
                'style="margin-top:15px;">'
                'Digest committed on blockchain'
                '</div>',
                unsafe_allow_html=True,
            )

            st.markdown(
                f'<div class="hash">'
                f'{committed_hash}'
                f'</div>',
                unsafe_allow_html=True,
            )

            st.markdown(
                '<div class="rule"></div>',
                unsafe_allow_html=True,
            )

            if (
                supplied_hash.lower()
                ==
                committed_hash.lower()
            ):

                st.markdown(
                    """
                    <div class="verify match">
                        <div class="verify-title">
                            ✓ MATCH
                        </div>
                        <div class="verify-text">
                            The supplied file bytes match
                            the content digest committed
                            on the blockchain.
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                st.success(
                    "Verification passed. The supplied "
                    "bytes match the committed content digest."
                )

            else:

                st.markdown(
                    """
                    <div class="verify mismatch">
                        <div class="verify-title">
                            ✗ MISMATCH
                        </div>
                        <div class="verify-text">
                            The supplied file bytes are
                            different from the bytes represented
                            by the committed content digest.
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                st.error(
                    "Verification failed because the supplied "
                    "file has different bytes from the committed asset."
                )

        else:

            st.caption(
                f"Upload {asset['file']} "
                "to demonstrate MATCH."
            )


# ============================================================
# BLOCKCHAIN EVIDENCE
# ============================================================

elif page == "Blockchain Evidence":

    st.markdown(
        """
        <div class="hero">
            <h1>Blockchain Evidence</h1>
            <p>
                Current deployment, transactions, token state,
                access control and practical test results.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        '<div class="section">Deployment</div>',
        unsafe_allow_html=True,
    )

    c1, c2, c3 = st.columns(3)

    with c1:

        st.markdown(
            f"""
            <div class="card">
                <div class="label">Network</div>
                <div class="value">{network}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c2:

        st.markdown(
            f"""
            <div class="card">
                <div class="label">Chain ID</div>
                <div class="value">{chain_id}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:

        st.markdown(
            f"""
            <div class="card">
                <div class="label">Deployment Block</div>
                <div class="value">{deployment_block}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown(
        "**Contract Address**"
    )

    st.code(
        contract_address
    )

    st.markdown(
        "**Deployment Transaction**"
    )

    st.code(
        deployment_tx
    )

    st.markdown(
        '<div class="section">Accounts</div>',
        unsafe_allow_html=True,
    )

    c1, c2, c3 = st.columns(3)

    with c1:

        st.markdown(
            "**Deployer**"
        )

        st.code(
            deployer_address
        )

    with c2:

        st.markdown(
            "**Minter**"
        )

        st.code(
            minter_address
        )

    with c3:

        st.markdown(
            "**Moderator**"
        )

        st.code(
            moderator_address
        )

    st.markdown(
        '<div class="section">Transactions</div>',
        unsafe_allow_html=True,
    )

    if TRANSACTIONS:

        for item in TRANSACTIONS:

            with st.container(
                border=True
            ):

                c1, c2, c3 = st.columns(
                    [2, 5, 2]
                )

                with c1:

                    st.markdown(
                        f"**{item['operation']}**"
                    )

                    st.caption(
                        f"Block {item['block']}"
                    )

                with c2:

                    st.code(
                        item["transaction"]
                    )

                with c3:

                    st.metric(
                        "Gas",
                        item["gas"]
                    )

    else:

        st.warning(
            "No transaction evidence found."
        )

    st.markdown(
        '<div class="section">Security Controls</div>',
        unsafe_allow_html=True,
    )

    c1, c2 = st.columns(2)

    with c1:

        st.error(
            "Duplicate Content Digest — REJECTED"
        )

        st.caption(
            "The smart contract prevents the same "
            "content digest from being registered twice."
        )

    with c2:

        if unauthorized_passed:

            st.success(
                "Unauthorized Dispute — REJECTED"
            )

        else:

            st.error(
                "Unauthorized Dispute — CHECK"
            )

        st.caption(
            "Only the authorized moderator can "
            "update the dispute flag."
        )

    st.markdown(
        '<div class="section">Automated Test Results</div>',
        unsafe_allow_html=True,
    )

    tests = test_results.get(
        "tests",
        {}
    )

    if tests:

        for test_name, result in tests.items():

            if result == "PASS":

                st.success(
                    f"{test_name}: PASS"
                )

            else:

                st.error(
                    f"{test_name}: {result}"
                )

    else:

        st.info(
            "Test result evidence not available."
        )

    st.markdown(
        '<div class="section">Compiler / Dependencies</div>',
        unsafe_allow_html=True,
    )

    c1, c2, c3, c4 = st.columns(4)

    with c1:

        st.metric(
            "Solidity",
            compiler.get(
                "solidity",
                "0.8.34"
            )
        )

    with c2:

        st.metric(
            "Hardhat",
            compiler.get(
                "hardhat",
                "3.18.0"
            )
        )

    with c3:

        st.metric(
            "OpenZeppelin",
            compiler.get(
                "openzeppelin",
                "5.6.1"
            )
        )

    with c4:

        st.metric(
            "ethers",
            compiler.get(
                "ethers",
                "6.17.0"
            )
        )


# ============================================================
# AI ANALYSIS
# ============================================================

else:

    st.markdown(
        """
        <div class="hero">
            <h1>AI / Anomaly Analysis</h1>
            <p>
                Lightweight deterministic anomaly detection
                using provenance digest patterns.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.info(
        "This project uses a deterministic rule-based anomaly "
        "detector rather than a trained machine-learning model. "
        "The detector identifies duplicate content or metadata "
        "digests."
    )

    c1, c2, c3 = st.columns(3)

    with c1:

        st.metric(
            "Assets Analyzed",
            len(manifest)
        )

    with c2:

        st.metric(
            "Anomalies Detected",
            len(ai_anomalies)
        )

    with c3:

        st.metric(
            "Evaluation Accuracy",
            f"{ai_accuracy * 100:.1f}%"
        )

    st.markdown(
        '<div class="section">Current Sample Analysis</div>',
        unsafe_allow_html=True,
    )

    if not ai_anomalies:

        st.success(
            "Current sample result: NO ANOMALIES"
        )

    else:

        for anomaly in ai_anomalies:

            st.warning(
                f"{anomaly['assetId']} | "
                f"{anomaly['type']} | "
                f"{anomaly['message']}"
            )

    st.markdown(
        '<div class="section">Rule Evaluation</div>',
        unsafe_allow_html=True,
    )

    for result in ai_evaluation:

        c1, c2, c3, c4 = st.columns(
            [3, 2, 2, 1]
        )

        with c1:

            st.write(
                result["case"]
            )

        with c2:

            st.write(
                f"Expected: {result['expected']}"
            )

        with c3:

            st.write(
                f"Detected: {result['detected']}"
            )

        with c4:

            if result["result"] == "PASS":

                st.success("PASS")

            else:

                st.error("FAIL")

    st.markdown(
        '<div class="section">AI Method</div>',
        unsafe_allow_html=True,
    )

    st.code(
        """
1. Load provenance records
2. Extract content digests
3. Extract metadata digests
4. Count duplicate values
5. Flag duplicate content/metadata
6. Evaluate using synthetic positive/negative cases
        """,
        language="text",
    )

    st.markdown(
        '<div class="section">AI Limitation</div>',
        unsafe_allow_html=True,
    )

    st.warning(
        "The detector is a deterministic rule-based component. "
        "The reported 100% accuracy is only the result of the "
        "small synthetic rule-unit evaluation and must not be "
        "presented as a general machine-learning benchmark."
    )


# ============================================================
# FOOTER
# ============================================================

st.markdown(
    """
    <div class="small" style="margin-top:40px;">
        Academic prototype. The dashboard presents generated
        project evidence. Smart-contract logic is implemented
        in Solidity and executed on the Hardhat local blockchain.
        Off-chain assets and metadata remain outside the blockchain.
    </div>
    """,
    unsafe_allow_html=True,
)