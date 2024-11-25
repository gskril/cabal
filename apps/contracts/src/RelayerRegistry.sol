// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @notice A simple registry of HTTP endpoints that have expressed interest in relaying messages for Cabals.
/// @dev App developers are encouraged to index this registry to find relayers to suggest to their users.
contract RelayerRegistry {
    /// @notice The address of the Cabal factory contract.
    address public cabal;

    /// @notice The number of days after which a relayer can be removed from the registry.
    uint256 public constant RELAYER_REMOVAL_DELAY = 7 days;

    /// @notice A mapping of relayer URLs and their initiation date.
    /// @dev Anybody can remove a relayer after 7 days to keep the registry clean.
    ///      If this is done nefariously, the relayer can always re-add themselves.
    mapping(string url => uint256 start) public relayers;

    /// @notice The number of relayers in the registry.
    uint256 public relayerCount;

    /// @notice Emitted when a new relayer is added.
    event RelayerAdded(string url);

    /// @notice Emitted when a relayer is removed.
    event RelayerRemoved(string url);

    /// @notice Modifier to ensure only the Cabal factory can call a function.
    modifier onlyCabal() {
        require(msg.sender == cabal, "Only the Cabal factory can call this function");
        _;
    }

    /// @notice Constructor for the RelayerRegistry contract.
    /// @param _cabal The address of the Cabal factory contract.
    constructor(address _cabal) {
        cabal = _cabal;
    }

    /// @notice Adds a new relayer to the registry.
    /// @param url The URL of the relayer.
    function addRelayer(string calldata url) external onlyCabal {
        relayerCount++;
        relayers[url] = block.timestamp;
        emit RelayerAdded(url);
    }

    /// @notice Removes a relayer from the registry.
    /// @dev The relayer can always re-add themselves afterwards if it causes problems.
    /// @param url The URL of the relayer to remove.
    function removeRelayer(string calldata url) external onlyCabal {
        require(relayers[url] + RELAYER_REMOVAL_DELAY < block.timestamp, "Relayer removal delay not met");
        relayerCount--;
        delete relayers[url];
        emit RelayerRemoved(url);
    }
}
