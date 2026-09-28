// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract DigitalAssetProvenance is ERC721, AccessControl {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    struct ProvenanceRecord {
        bytes32 contentDigest;
        bytes32 metadataDigest;
        address creator;
        address minter;
        string declaration;
        string declaredTool;
        string licenseURI;
        bool disputed;
        uint256 createdAt;
    }

    uint256 private _nextTokenId = 1;

    mapping(uint256 => ProvenanceRecord) private _provenance;

    mapping(bytes32 => uint256) public tokenByContentDigest;

    event AssetMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed minter,
        bytes32 contentDigest,
        bytes32 metadataDigest
    );

    event AssetTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    event AssetDisputeUpdated(
        uint256 indexed tokenId,
        bool disputed,
        address indexed moderator
    );

    constructor(address moderator)
        ERC721("Digital Asset Provenance", "DAP")
    {
        require(moderator != address(0), "Invalid moderator");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, moderator);
    }

    function mintAsset(
        address creator,
        bytes32 contentDigest,
        bytes32 metadataDigest,
        string calldata declaration,
        string calldata declaredTool,
        string calldata licenseURI
    ) external returns (uint256) {
        require(creator != address(0), "Invalid creator");
        require(contentDigest != bytes32(0), "Invalid content digest");
        require(metadataDigest != bytes32(0), "Invalid metadata digest");
        require(
            tokenByContentDigest[contentDigest] == 0,
            "Duplicate content digest"
        );

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        _provenance[tokenId] = ProvenanceRecord({
            contentDigest: contentDigest,
            metadataDigest: metadataDigest,
            creator: creator,
            minter: msg.sender,
            declaration: declaration,
            declaredTool: declaredTool,
            licenseURI: licenseURI,
            disputed: false,
            createdAt: block.timestamp
        });

        tokenByContentDigest[contentDigest] = tokenId;

        emit AssetMinted(
            tokenId,
            creator,
            msg.sender,
            contentDigest,
            metadataDigest
        );

        return tokenId;
    }

    function getProvenance(
        uint256 tokenId
    ) external view returns (ProvenanceRecord memory) {
        _requireOwned(tokenId);
        return _provenance[tokenId];
    }

    function setDispute(
        uint256 tokenId,
        bool disputed
    ) external onlyRole(MODERATOR_ROLE) {
        _requireOwned(tokenId);

        _provenance[tokenId].disputed = disputed;

        emit AssetDisputeUpdated(
            tokenId,
            disputed,
            msg.sender
        );
    }

    function isDisputed(
        uint256 tokenId
    ) external view returns (bool) {
        _requireOwned(tokenId);
        return _provenance[tokenId].disputed;
    }

    function getTokenByContentDigest(
        bytes32 contentDigest
    ) external view returns (uint256) {
        return tokenByContentDigest[contentDigest];
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override
        returns (address)
    {
        address from = super._update(to, tokenId, auth);

        if (from != address(0)) {
            emit AssetTransferred(tokenId, from, to);
        }

        return from;
    }
}