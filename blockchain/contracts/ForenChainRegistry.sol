// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ForenChainRegistry
 * @dev Anchors digital forensic evidence integrity records, Merkle roots, and custody events.
 */
contract ForenChainRegistry {
    address public owner;

    struct EvidenceRecord {
        string evidenceId;
        string sha256Hash;
        string merkleRoot;
        string analysisReportHash;
        uint256 timestamp;
        address registeredBy;
        bool exists;
    }

    struct CustodyEvent {
        string eventId;
        string evidenceId;
        string eventType;
        string eventRecordHash;
        uint256 timestamp;
        address actor;
    }

    // Mapping from evidenceId hash to EvidenceRecord
    mapping(bytes32 => EvidenceRecord) public evidenceRegistry;
    
    // Mapping from evidenceId hash to list of CustodyEvents
    mapping(bytes32 => CustodyEvent[]) private custodyHistory;

    // Ordered list of registered evidence hashes for enumeration
    bytes32[] public registeredEvidenceList;

    event EvidenceRegistered(
        string indexed evidenceId,
        bytes32 indexed evidenceKey,
        string sha256Hash,
        string merkleRoot,
        string analysisReportHash,
        uint256 timestamp,
        address registeredBy
    );

    event CustodyEventLogged(
        string indexed evidenceId,
        string eventId,
        string eventType,
        string eventRecordHash,
        uint256 timestamp,
        address actor
    );

    constructor() {
        owner = msg.sender;
    }

    function getKey(string memory _evidenceId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_evidenceId));
    }

    function registerEvidence(
        string memory _evidenceId,
        string memory _sha256Hash,
        string memory _merkleRoot,
        string memory _analysisReportHash
    ) external {
        bytes32 key = getKey(_evidenceId);
        require(!evidenceRegistry[key].exists, "Evidence already registered");
        require(bytes(_evidenceId).length > 0, "Evidence ID required");
        require(bytes(_sha256Hash).length > 0, "SHA-256 hash required");

        evidenceRegistry[key] = EvidenceRecord({
            evidenceId: _evidenceId,
            sha256Hash: _sha256Hash,
            merkleRoot: _merkleRoot,
            analysisReportHash: _analysisReportHash,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        registeredEvidenceList.push(key);

        emit EvidenceRegistered(
            _evidenceId,
            key,
            _sha256Hash,
            _merkleRoot,
            _analysisReportHash,
            block.timestamp,
            msg.sender
        );
    }

    function logCustodyEvent(
        string memory _evidenceId,
        string memory _eventId,
        string memory _eventType,
        string memory _eventRecordHash
    ) external {
        bytes32 key = getKey(_evidenceId);
        require(evidenceRegistry[key].exists, "Evidence not registered");

        CustodyEvent memory evt = CustodyEvent({
            eventId: _eventId,
            evidenceId: _evidenceId,
            eventType: _eventType,
            eventRecordHash: _eventRecordHash,
            timestamp: block.timestamp,
            actor: msg.sender
        });

        custodyHistory[key].push(evt);

        emit CustodyEventLogged(
            _evidenceId,
            _eventId,
            _eventType,
            _eventRecordHash,
            block.timestamp,
            msg.sender
        );
    }

    function getEvidence(string memory _evidenceId) external view returns (
        string memory evidenceId,
        string memory sha256Hash,
        string memory merkleRoot,
        string memory analysisReportHash,
        uint256 timestamp,
        address registeredBy,
        bool exists
    ) {
        bytes32 key = getKey(_evidenceId);
        EvidenceRecord memory rec = evidenceRegistry[key];
        return (
            rec.evidenceId,
            rec.sha256Hash,
            rec.merkleRoot,
            rec.analysisReportHash,
            rec.timestamp,
            rec.registeredBy,
            rec.exists
        );
    }

    function getCustodyEventsCount(string memory _evidenceId) external view returns (uint256) {
        bytes32 key = getKey(_evidenceId);
        return custodyHistory[key].length;
    }

    function getCustodyEvent(string memory _evidenceId, uint256 index) external view returns (
        string memory eventId,
        string memory evidenceId,
        string memory eventType,
        string memory eventRecordHash,
        uint256 timestamp,
        address actor
    ) {
        bytes32 key = getKey(_evidenceId);
        require(index < custodyHistory[key].length, "Index out of bounds");
        CustodyEvent memory evt = custodyHistory[key][index];
        return (
            evt.eventId,
            evt.evidenceId,
            evt.eventType,
            evt.eventRecordHash,
            evt.timestamp,
            evt.actor
        );
    }

    function verifyIntegrity(
        string memory _evidenceId,
        string memory _sha256Hash,
        string memory _merkleRoot
    ) external view returns (bool matches) {
        bytes32 key = getKey(_evidenceId);
        EvidenceRecord memory rec = evidenceRegistry[key];
        if (!rec.exists) {
            return false;
        }
        return (
            keccak256(abi.encodePacked(rec.sha256Hash)) == keccak256(abi.encodePacked(_sha256Hash)) &&
            keccak256(abi.encodePacked(rec.merkleRoot)) == keccak256(abi.encodePacked(_merkleRoot))
        );
    }

    function getTotalRegistered() external view returns (uint256) {
        return registeredEvidenceList.length;
    }
}
