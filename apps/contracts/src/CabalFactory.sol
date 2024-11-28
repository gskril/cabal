// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Cabal} from "./Cabal.sol";

/// @notice A factory for creating Cabal contracts.
contract CabalFactory {
    /// @notice The address of the RelayerRegistry contract.
    address public constant relayers = 0xcaba1C9708fB81263602ad2D8549b1d8697392BA;

    /// @notice The address of the Cabal implementation contract.
    address public immutable implementation;

    event CabalCreated(address indexed cabal);

    constructor() {
        implementation = address(new Cabal());
    }

    /// @notice Creates a new Cabal contract.
    function createCabal(uint256 identityCommitment) external returns (address) {
        address cabal = Clones.clone(implementation);
        Cabal(payable(cabal)).initialize(identityCommitment);
        emit CabalCreated(address(cabal));
        return cabal;
    }
}
