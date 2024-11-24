// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

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
/// @dev Effectively a 1/n multi-sig wallet that can call arbitrary functions, sign ERC-1271 messages, etc.
contract Cabal {
    /*//////////////////////////////////////////////////////////////
                               PARAMETERS
    //////////////////////////////////////////////////////////////*/

    /// @notice The name of the contract.
    string public constant name = "Cabal";

    /// @dev https://docs.semaphore.pse.dev/deployed-contracts
    ISemaphore constant semaphore = ISemaphore(0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f);

    /// @notice The Semaphore group ID for the account.
    uint256 public immutable semaphoreGroupId;

    /// @notice The token that relayer fees are paid in.
    /// @dev address(0) for ETH, otherwise an ERC-20 token address. Defaults to ETH.
    address public feeToken;

    /// @notice The amount of {feeToken} that is paid to a relayer for executing a transaction.
    /// @dev Defaults to 0.
    uint256 public feeAmount;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Received(address indexed sender, uint256 indexed value);
    event MemberAdded(uint256 indexed identityCommitment);
    event ExecutionSuccess(uint256 indexed value);
    event ExecutionFailure();

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

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

    /// @notice Initializes the multisig account.
    /// @param _identityCommitment The identity commitment of the first member of the group.
    constructor(uint256 _identityCommitment) {
        semaphoreGroupId = semaphore.createGroup();
        semaphore.addMember(semaphoreGroupId, _identityCommitment);
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// @dev This is the equivalent of calling `semaphore.addMember(semaphoreGroupId, identityCommitment);`
    /// @dev Uses `execute()` for consistency, even though a custom `proof.message` would be simpler.
    function addMember(uint256 identityCommitment, ISemaphore.SemaphoreProof calldata proof) external {
        bytes4 selector = semaphore.addMember.selector;
        bytes memory data = abi.encodeWithSelector(selector, semaphoreGroupId, identityCommitment);
        execute(address(semaphore), 0, data, proof);
        emit MemberAdded(identityCommitment);
    }

    /// @notice Executes a call to an arbitrary contract.
    /// @dev Protected by a Semaphore proof, but can be called by anyone (e.g. relayers to preserve privacy).
    function execute(address to, uint256 value, bytes memory data, ISemaphore.SemaphoreProof calldata proof)
        public
        virtual
    {
        // Check if the Semaphore proof is valid and hasn't already been used
        _validateProof(proof);

        // Check if the calldata matches `proof.message` so relayers can't execute arbitrary calls
        bytes32 intentHash = keccak256(abi.encode(to, value, data));
        if (proof.message != uint256(intentHash)) revert InvalidIntent();

        // Execute the intended call
        (bool success,) = to.call{value: value}(data);
        if (success) emit ExecutionSuccess(value);
        else emit ExecutionFailure();
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
}
