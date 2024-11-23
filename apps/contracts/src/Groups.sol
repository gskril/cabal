// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @dev Typically identityCommitments are private, but we're ok storing them alongside the NFTs because the client will never
///      see them thanks to ZuPass.
contract Group {
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

    /// @notice The Semaphore group ID for each ERC1155 NFT contract.
    mapping(IERC1155 nft => uint256 semaphoreGroup) public groups;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidSignature();
    error NotOwner();
    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(string memory _name) {
        name = _name;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function createGroup(IERC1155 nft) external {}

    function joinGroup(IERC1155 nft, uint256 identityCommitment) external {
        // Verify that the caller owns the NFT
        // nft.balanceOf(msg.sender, 1);

        semaphore.addMember(groups[nft], identityCommitment);
    }

    // Read function that takes an address, a signature to prove ownership of the address, and an NFT contract address
    // if the signature is valid and the address owns the NFT, return an EIP-1271 signed message that can be verified in joinGroup()
    function getProofOfOwnership(IERC1155 nft, address owner, bytes memory signature)
        external
        view
        returns (bytes32 _hash, bytes calldata _signature)
    {
        // Verify the signature, where the message is `${nft}:${owner}`
        // If the signature is valid, return an EIP-1271 signed message that can be verified in joinGroup()
        // Otherwise, return an empty bytes object

        bytes memory message = abi.encodePacked(nft, owner);
        if (!SignatureChecker.isValidSignatureNow(owner, MessageHashUtils.toEthSignedMessageHash(message), signature)) {
            revert InvalidSignature();
        }

        if (nft.balanceOf(owner, 1) == 0) {
            revert NotOwner();
        }

        // Return an EIP-1271 signed message that can be verified in joinGroup()

        return (_hash, signature);
    }

    function isValidSignature(bytes32 hash, bytes calldata signature) public view returns (bytes4) {
        (IERC1155 nft, address owner) = abi.decode(signature, (IERC1155, address));

        if (nft.balanceOf(owner, 1) == 0) {
            return 0xffffffff;
        }

        return 0x1626ba7e;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                           REQUIRED OVERRIDES
    //////////////////////////////////////////////////////////////*/
}
