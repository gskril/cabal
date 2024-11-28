// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @notice A simple registry of HTTP endpoints that have expressed interest in relaying messages for Cabals.
/// @dev App developers are encouraged to index this registry to find relayers to suggest to their users.
/// @dev Relayers must handle POST requests that match the JSON body format described in the following file:
///      https://github.com/gskril/cabal/blob/main/apps/relayer/README.md
contract RelayerRegistry {
    /// @notice The number of days after which a relayer can be removed from the registry.
    uint256 internal constant RELAYER_REMOVAL_DELAY = 7 days;

    /// @notice A mapping of relayer URLs and their creation date.
    /// @dev Anybody can remove a relayer after 7 days to keep the registry clean.
    mapping(bytes32 urlHash => uint256 timestamp) internal createdAt;

    /// @notice The number of active relayers in the registry.
    uint256 public relayerCount;

    event RelayerAdded(string url);
    event RelayerRemoved(string url);

    error AlreadyExists(string url);
    error NotExpired(string url);

    /// @notice Adds a new relayer to the registry.
    /// @param url The URL of the relayer.
    function addRelayer(string calldata url) external {
        bytes32 urlHash = _hashUrl(url);
        if (createdAt[urlHash] != 0) revert AlreadyExists(url);
        relayerCount++;
        createdAt[urlHash] = block.timestamp;
        emit RelayerAdded(url);
    }

    /// @notice Removes a relayer from the registry. Can only be done after a 7 day period.
    /// @dev This is an attempt to prevent spam. The relayer can re-add themselves if needed.
    /// @param url The URL of the relayer to remove.
    function removeRelayer(string calldata url) external {
        bytes32 urlHash = _hashUrl(url);
        if (createdAt[urlHash] + RELAYER_REMOVAL_DELAY >= block.timestamp) revert NotExpired(url);
        relayerCount--;
        delete createdAt[urlHash];
        emit RelayerRemoved(url);
    }

    /// @dev Hashes a URL to a bytes32 value so it's more efficient to store onchain.
    function _hashUrl(string calldata url) internal pure returns (bytes32) {
        return keccak256(abi.encode(url));
    }
}
