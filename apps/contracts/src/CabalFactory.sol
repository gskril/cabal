// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Cabal} from "./Cabal.sol";

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

/// @notice A factory for creating Cabal contracts.
contract CabalFactory {
    /// @notice The address of the RelayerRegistry contract.
    address public immutable relayers;

    /// @notice The address of the Cabal implementation contract.
    address public immutable implementation;

    event CabalCreated(address indexed cabal);

    constructor(address _relayers) {
        relayers = _relayers;
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
