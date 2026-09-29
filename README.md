# Digital Asset Provenance

An **NFT-based digital asset provenance system** for AI-generated digital assets.

This project records the identity and provenance of digital assets using **SHA-256 hashes and an ERC-721 style smart contract** on a local Ethereum-compatible blockchain.

## Features

* Register AI-generated digital assets
* Generate SHA-256 content and metadata hashes
* Mint ERC-721 style provenance NFTs
* Store creator, minter, tool, declaration and license information
* Prevent duplicate content registration
* Transfer NFTs between accounts
* Moderator-controlled dispute flag
* Verify original assets against blockchain records
* Detect tampered files using hash comparison
* Lightweight rule-based anomaly detection
* Automated smart contract tests
* Streamlit dashboard for viewing provenance and verification results

## Technology Used

* **Solidity** – Smart contract
* **OpenZeppelin** – ERC-721 and access control
* **Hardhat** – Blockchain development and testing
* **ethers.js** – Blockchain interaction
* **Python** – Asset hashing and anomaly detection
* **Streamlit** – Web dashboard
* **SHA-256** – Digital asset integrity verification
* **Local Hardhat Network** – Blockchain environment

## Project Structure

```text
DigitalAssetProvenance/
│
├── ai/             Anomaly detection
├── assets/         Digital assets
├── client/         Streamlit dashboard
├── contracts/      Solidity smart contract
├── evidence/       Generated blockchain evidence
├── metadata/       Asset metadata
├── scripts/        Automation scripts
├── test/           Smart contract tests
└── verification/  Asset verification scripts
```

## How It Works

```text
Digital Asset
     ↓
SHA-256 Hash
     ↓
Metadata Hash
     ↓
Smart Contract
     ↓
ERC-721 Token
     ↓
Blockchain Provenance
     ↓
Independent Verification
```

The actual asset remains **off-chain**. The blockchain stores its cryptographic digest and provenance information.

## Run the Project

### 1. Install dependencies

```bash
npm install
```

### 2. Compile the contract

```bash
npx hardhat compile
```

### 3. Start the local blockchain

```bash
npx hardhat node
```

Keep this terminal running.

### 4. Run the complete demonstration

Open another terminal:

```bash
npx hardhat run .\scripts\run_full_demo.js --network localhost
```

This automatically performs:

* Contract deployment
* Asset registration
* NFT minting
* NFT transfer
* Dispute testing
* Blockchain verification
* Evidence generation

### 5. Run smart contract tests

```bash
npx hardhat test
```

### 6. Start the dashboard

```bash
python -m streamlit run .\client\app.py
```

## Verification

The verifier calculates the SHA-256 hash of a supplied file and compares it with the digest stored on the blockchain.

**Original file:**

```text
VERIFICATION RESULT: MATCH
```

**Modified/tampered file:**

```text
VERIFICATION RESULT: MISMATCH
```

## Important Limitation

A matching hash proves that the supplied file has the **same bytes as the file committed on-chain**.

It does **not** by itself prove:

* Copyright ownership
* Originality
* Legal ownership
* Source authenticity
* That the declared AI tool actually generated the asset

The project is therefore a **digital asset provenance and integrity-verification prototype**.


---

