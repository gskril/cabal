// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ISemaphore} from "./ISemaphore.sol";

///////////////////////////////////////////////////////////////////////
//                                                                   //
//      .g8"""bgd     db      `7MM"""Yp,      db      `7MMF'         //
//    .dP'     `M    ;MM:       MM    Yb     ;MM:       MM           //
//    dM'       `   ,V^MM.      MM    dP    ,V^MM.      MM           //
//    MM           ,M  `MM      MM"""bg.   ,M  `MM      MM           //
//    MM.          AbmmmqMA     MM    `Y   AbmmmqMA     MM      ,    //
//    `Mb.     ,' A'     VML    MM    ,9  A'     VML    MM     ,M    //
//      `"bmmmd'.AMA.   .AMMA..JMMmmmd9 .AMA.   .AMMA..JMMmmmmMMM    //
//                                                                   //
///////////////////////////////////////////////////////////////////////

/// @notice A shared, anonymous, invite-only smart contract account.
/// @dev Effectively a 1/n multi-sig wallet that can call arbitrary smart contract functions.
contract Cabal is Initializable {
    /*//////////////////////////////////////////////////////////////
                               PARAMETERS
    //////////////////////////////////////////////////////////////*/

    /// @notice The name of the contract.
    string public constant name = "Cabal";

    /// @notice The ID of the chain this contract is on.
    uint256 public chainId;

    /// @dev https://docs.semaphore.pse.dev/deployed-contracts
    ISemaphore public constant semaphore = ISemaphore(0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f);

    /// @notice The Semaphore group ID for the account.
    uint256 public semaphoreGroupId;

    /// @notice The amount of ETH paid to a relayer for executing a transaction.
    /// @dev Defaults to 0.
    uint256 public feeAmount;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Received(address indexed sender, uint256 indexed value);
    event MemberAdded(uint256 indexed identityCommitment);
    event FeeChanged(uint256 indexed amount);
    event ExecutionSuccess(uint256 indexed value, uint256 indexed fee);
    event ExecutionFailure();

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error FailedToSendFee();
    error InsufficientBalance();

    // For some reason, reverting with the error from ISemaphoreBase doesn't work
    // So we have to manually redefine them here
    error GroupHasNoMembers();
    error MerkleTreeDepthIsNotSupported();
    error MerkleTreeRootIsExpired();
    error MerkleTreeRootIsNotPartOfTheGroup();
    error YouAreUsingTheSameNullifierTwice();
    error InvalidProof();
    error InvalidIntent();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the multisig account.
    /// @param _identityCommitment The identity commitment of the first member of the group.
    /// @param _feeAmount The amount of ETH paid to a relayer for executing a transaction.
    function initialize(uint256 _identityCommitment, uint256 _feeAmount) external initializer {
        semaphoreGroupId = semaphore.createGroup();
        semaphore.addMember(semaphoreGroupId, _identityCommitment);
        emit MemberAdded(_identityCommitment);
        _setFee(_feeAmount);
        uint256 _chainId;

        assembly {
            _chainId := chainid()
        }
        chainId = _chainId;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @dev For receiving ETH.
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// @notice Adds a member to the Semaphore group.
    function addMember(uint256 identityCommitment, ISemaphore.SemaphoreProof calldata proof) external {
        // Check if the Semaphore proof is valid and hasn't already been used
        _validateProof(proof);

        // Check if the identityCommitment matches `proof.message` so relayers can't modify it
        if (proof.message != identityCommitment) revert InvalidIntent();

        // Add the member
        semaphore.addMember(semaphoreGroupId, identityCommitment);
        emit MemberAdded(identityCommitment);
    }

    /// @notice Sets the fee amount.
    function setFee(uint256 amount, ISemaphore.SemaphoreProof calldata proof) external {
        // Check if the Semaphore proof is valid and hasn't already been used
        _validateProof(proof);

        // Check if the amount matches `proof.message` so relayers can't modify it
        if (proof.message != amount) revert InvalidIntent();

        // Set the fee
        _setFee(amount);
    }

    /// @notice Executes a call to an arbitrary contract.
    /// @dev Protected by a Semaphore proof, but can be called by anyone (e.g. relayers to preserve privacy).
    function execute(address to, uint256 value, bytes memory data, ISemaphore.SemaphoreProof calldata proof) external {
        execute(to, value, data, proof, true);
    }

    /// @notice Executes a call to an arbitrary contract.
    /// @dev Protected by a Semaphore proof, but can be called by anyone (e.g. relayers to preserve privacy).
    function execute(
        address to,
        uint256 value,
        bytes memory data,
        ISemaphore.SemaphoreProof calldata proof,
        bool takeFee
    ) public {
        // Check if the contract has a sufficient balance
        if (address(this).balance < value + feeAmount) revert InsufficientBalance();

        // Check if the Semaphore proof is valid and hasn't already been used
        _validateProof(proof);

        // Check if the calldata matches `proof.message` so relayers can't execute arbitrary calls
        bytes32 intentHash = keccak256(abi.encode(to, value, data, chainId));
        if (proof.message != uint256(intentHash)) revert InvalidIntent();

        // Execute the intended call
        (bool success,) = to.call{value: value}(data);
        if (!success) {
            emit ExecutionFailure();
        } else {
            (uint256 fee) = _handleFee(takeFee);
            emit ExecutionSuccess(value, fee);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Checks if a Semaphore proof is valid.
    function isValidProof(ISemaphore.SemaphoreProof calldata proof) external view returns (bool) {
        return semaphore.verifyProof(semaphoreGroupId, proof);
    }

    /// @notice Returns the Merkle tree root of the group.
    function getMerkleTreeRoot() external view returns (uint256) {
        return semaphore.getMerkleTreeRoot(semaphoreGroupId);
    }

    /// @notice Returns the depth of the Merkle tree of the group.
    function getMerkleTreeDepth() external view returns (uint256) {
        return semaphore.getMerkleTreeDepth(semaphoreGroupId);
    }

    /// @notice Returns the number of leaves in the Merkle tree of the group.
    function getMerkleTreeSize() external view returns (uint256) {
        return semaphore.getMerkleTreeSize(semaphoreGroupId);
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Validates a Semaphore proof.
    /// @dev Reverts with the appropriate Semaphore error if the proof is invalid.
    function _validateProof(ISemaphore.SemaphoreProof calldata proof) internal {
        try semaphore.validateProof(semaphoreGroupId, proof) {}
        catch (bytes memory _reason) {
            bytes4 reason = bytes4(_reason);

            // Revert with the appropriate error
            if (reason == 0xc8b02e01) revert GroupHasNoMembers();
            else if (reason == 0xecf64f12) revert MerkleTreeDepthIsNotSupported();
            else if (reason == 0x9581a990) revert MerkleTreeRootIsExpired();
            else if (reason == 0x4d329586) revert MerkleTreeRootIsNotPartOfTheGroup();
            else if (reason == 0x208b15e8) revert YouAreUsingTheSameNullifierTwice();
            else revert InvalidProof();
        }
    }

    /// @notice Handles the fee for the relayer of a private transaction.
    /// @dev Reverts if the fee cannot be sent.
    function _handleFee(bool enabled) internal returns (uint256) {
        if (!enabled || feeAmount == 0) return 0;
        (bool success,) = payable(msg.sender).call{value: feeAmount}("");
        if (!success) revert FailedToSendFee();
        return feeAmount;
    }

    function _setFee(uint256 amount) internal {
        feeAmount = amount;
        emit FeeChanged(amount);
    }
}
