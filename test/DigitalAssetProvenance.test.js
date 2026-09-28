import hre from "hardhat";
import assert from "node:assert/strict";

describe("DigitalAssetProvenance", function () {
    let ethers;
    let deployer;
    let user;
    let moderator;
    let contract;

    const CONTENT_DIGEST =
        "0xc418253b998914c07702180e87262f056d17477a7aed6e3251e015c107e994e5";

    const METADATA_DIGEST =
        "0x54ace07fdc1ea6266e079d47dd9bbda15362614827fb040f1c587d4af7706d94";

    const DECLARATION =
        "The minter declares that this asset is an original or permitted sample asset for academic provenance demonstration.";

    const DECLARED_TOOL =
        "Student-created sample asset";

    const LICENSE_URI =
        "academic-demo-license";

    beforeEach(async function () {
        const connection = await hre.network.connect();

        ethers = connection.ethers;

        [deployer, user, moderator] =
            await ethers.getSigners();

        const DigitalAssetProvenance =
            await ethers.getContractFactory(
                "DigitalAssetProvenance"
            );

        contract = await DigitalAssetProvenance.deploy(
            moderator.address
        );

        await contract.waitForDeployment();
    });

    it("deploys the contract and assigns the moderator role", async function () {
        const MODERATOR_ROLE = ethers.keccak256(
            ethers.toUtf8Bytes("MODERATOR_ROLE")
        );

        const hasRole = await contract.hasRole(
            MODERATOR_ROLE,
            moderator.address
        );

        assert.equal(
            hasRole,
            true,
            "Moderator should have MODERATOR_ROLE"
        );
    });

    it("mints an asset as Token #1", async function () {
        const tx = await contract
            .connect(deployer)
            .mintAsset(
                deployer.address,
                CONTENT_DIGEST,
                METADATA_DIGEST,
                DECLARATION,
                DECLARED_TOOL,
                LICENSE_URI
            );

        await tx.wait();

        const owner = await contract.ownerOf(1);

        assert.equal(
            owner,
            deployer.address,
            "Token #1 should belong to the deployer"
        );
    });

    it("stores provenance correctly", async function () {
        const tx = await contract
            .connect(deployer)
            .mintAsset(
                deployer.address,
                CONTENT_DIGEST,
                METADATA_DIGEST,
                DECLARATION,
                DECLARED_TOOL,
                LICENSE_URI
            );

        await tx.wait();

        const record =
            await contract.getProvenance(1);

        assert.equal(
            record.contentDigest,
            CONTENT_DIGEST,
            "Content digest is incorrect"
        );

        assert.equal(
            record.metadataDigest,
            METADATA_DIGEST,
            "Metadata digest is incorrect"
        );

        assert.equal(
            record.creator,
            deployer.address,
            "Creator is incorrect"
        );

        assert.equal(
            record.minter,
            deployer.address,
            "Minter is incorrect"
        );

        assert.equal(
            record.declaration,
            DECLARATION,
            "Declaration is incorrect"
        );

        assert.equal(
            record.declaredTool,
            DECLARED_TOOL,
            "Declared tool is incorrect"
        );

        assert.equal(
            record.licenseURI,
            LICENSE_URI,
            "License URI is incorrect"
        );

        assert.equal(
            record.disputed,
            false,
            "New asset should not be disputed"
        );
    });

    it("rejects duplicate content digest", async function () {
        const firstMint =
            await contract
                .connect(deployer)
                .mintAsset(
                    deployer.address,
                    CONTENT_DIGEST,
                    METADATA_DIGEST,
                    DECLARATION,
                    DECLARED_TOOL,
                    LICENSE_URI
                );

        await firstMint.wait();

        await assert.rejects(
            contract
                .connect(user)
                .mintAsset(
                    user.address,
                    CONTENT_DIGEST,
                    METADATA_DIGEST,
                    DECLARATION,
                    DECLARED_TOOL,
                    LICENSE_URI
                ),
            /Duplicate content digest/i
        );
    });

    it("transfers Token #1 to another account", async function () {
        const mintTx =
            await contract
                .connect(deployer)
                .mintAsset(
                    deployer.address,
                    CONTENT_DIGEST,
                    METADATA_DIGEST,
                    DECLARATION,
                    DECLARED_TOOL,
                    LICENSE_URI
                );

        await mintTx.wait();

        await contract
            .connect(deployer)
            .transferFrom(
                deployer.address,
                user.address,
                1
            );

        const newOwner =
            await contract.ownerOf(1);

        assert.equal(
            newOwner,
            user.address,
            "Token #1 should belong to the new owner"
        );
    });

    it("preserves provenance after transfer", async function () {
        const mintTx =
            await contract
                .connect(deployer)
                .mintAsset(
                    deployer.address,
                    CONTENT_DIGEST,
                    METADATA_DIGEST,
                    DECLARATION,
                    DECLARED_TOOL,
                    LICENSE_URI
                );

        await mintTx.wait();

        const beforeTransfer =
            await contract.getProvenance(1);

        await contract
            .connect(deployer)
            .transferFrom(
                deployer.address,
                user.address,
                1
            );

        const afterTransfer =
            await contract.getProvenance(1);

        assert.equal(
            afterTransfer.contentDigest,
            beforeTransfer.contentDigest,
            "Content digest changed after transfer"
        );

        assert.equal(
            afterTransfer.metadataDigest,
            beforeTransfer.metadataDigest,
            "Metadata digest changed after transfer"
        );

        assert.equal(
            afterTransfer.creator,
            beforeTransfer.creator,
            "Creator changed after transfer"
        );

        assert.equal(
            afterTransfer.minter,
            beforeTransfer.minter,
            "Minter changed after transfer"
        );

        assert.equal(
            afterTransfer.declaration,
            beforeTransfer.declaration,
            "Declaration changed after transfer"
        );

        assert.equal(
            afterTransfer.declaredTool,
            beforeTransfer.declaredTool,
            "Declared tool changed after transfer"
        );

        assert.equal(
            afterTransfer.licenseURI,
            beforeTransfer.licenseURI,
            "License URI changed after transfer"
        );
    });

    it("allows the moderator to set the dispute flag", async function () {
        const mintTx =
            await contract
                .connect(deployer)
                .mintAsset(
                    deployer.address,
                    CONTENT_DIGEST,
                    METADATA_DIGEST,
                    DECLARATION,
                    DECLARED_TOOL,
                    LICENSE_URI
                );

        await mintTx.wait();

        const before =
            await contract.isDisputed(1);

        assert.equal(
            before,
            false,
            "Token should initially not be disputed"
        );

        const disputeTx =
            await contract
                .connect(moderator)
                .setDispute(1, true);

        await disputeTx.wait();

        const after =
            await contract.isDisputed(1);

        assert.equal(
            after,
            true,
            "Moderator should be able to set dispute"
        );
    });

    it("rejects unauthorized dispute attempts", async function () {
        const mintTx =
            await contract
                .connect(deployer)
                .mintAsset(
                    deployer.address,
                    CONTENT_DIGEST,
                    METADATA_DIGEST,
                    DECLARATION,
                    DECLARED_TOOL,
                    LICENSE_URI
                );

        await mintTx.wait();

        await assert.rejects(
            contract
                .connect(user)
                .setDispute(1, false)
        );

        const disputed =
            await contract.isDisputed(1);

        assert.equal(
            disputed,
            false,
            "Unauthorized account must not change dispute status"
        );
    });
});