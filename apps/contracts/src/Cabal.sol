// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

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
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

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
    event MemberRemoved(uint256 indexed identityCommitment);
    event ExecutionSuccess(uint256 indexed value);
    event ExecutionFailure();

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ExecutionFailed();
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
    }

    /// @notice Executes a call to an arbitrary contract.
    /// @dev Protected by a Semaphore proof, but can be called by anyone (e.g. relayers to preserve privacy).
    function execute(address to, uint256 value, bytes memory data, ISemaphore.SemaphoreProof calldata proof)
        public
        virtual
    {
        // Check if the Semaphore proof is valid and hasn't already been used
        semaphore.validateProof(semaphoreGroupId, proof);

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
}