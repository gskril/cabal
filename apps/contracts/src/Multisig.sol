// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @notice A shared smart contract account that can be used by multiple users.
/// @dev This is effectively a 1/n multisig wallet that can call arbitrary functions on any smart contract, sign messages, etc.
contract Account {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice A struct that contains the intent of a member to execute a call.
    /// @custom:field messageHash The hash of the calldata that the member wants to execute.
    /// @custom:field signature The signature of the member.
    /// @custom:field pubKey The public key of the member.
    struct SemaphoreIntent {
        address to;
        uint256 value;
        bytes data;
        bytes32 messageHash;
        bytes32 signature;
        bytes pubKey;
    }

    /*//////////////////////////////////////////////////////////////
                               PARAMETERS
    //////////////////////////////////////////////////////////////*/

    /// @notice The name of the contract.
    string public name;

    /// @dev https://docs.semaphore.pse.dev/deployed-contracts
    ISemaphore constant semaphore = ISemaphore(0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f);

    /// @notice The Semaphore group ID for the account.
    uint256 public immutable semaphoreGroupId;

    /// @notice The token that relayer fees are paid in.

    /// @notice The amount of {token} that is paid to a relayer for executing a transaction.

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Received(address indexed sender, uint256 indexed value);
    event ExecutionSuccess(bytes32 indexed txHash, uint256 indexed payment);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ExecutionFailed();
    error InvalidProof();
    error InvalidIntent();
    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    // TODO: we need a way to stuff the proof with intended calldata or something so that it can only be used as intended
    // https://docs.semaphore.pse.dev/guides/identities#sign-and-verify-messages
    modifier onlyMember(ISemaphore.SemaphoreProof calldata proof, SemaphoreIntent calldata intent) {
        semaphore.validateProof(semaphoreGroupId, proof);
        if (intent.messageHash != keccak256(abi.encode(intent.to, intent.value, intent.data))) revert InvalidIntent();
        _;
    }

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

    /// @notice Executes a call to an arbitrary contract.
    /// @dev This function is protected by the Semaphore proof, but can be called by anyone. This is meant to be used with relayers to preserve privacy.
    function execute(
        address to,
        bytes calldata data,
        uint256 value,
        ISemaphore.SemaphoreProof calldata proof,
        SemaphoreIntent calldata intent
    ) public {
        // Verify the intent matches the calldata
        if (intent.messageHash != keccak256(abi.encode(to, value, data))) revert InvalidIntent();

        // Validate the Semaphore prof
        semaphore.validateProof(semaphoreGroupId, proof);

        (bool success,) = to.call{value: value}(data);
        if (!success) revert ExecutionFailed();
    }

    function addMember(uint256 identityCommitment, ISemaphore.SemaphoreProof calldata proof) public onlyMember(proof) {
        semaphore.addMember(semaphoreGroupId, identityCommitment);
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
}
