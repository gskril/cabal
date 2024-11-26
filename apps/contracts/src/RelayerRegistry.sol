// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @notice A simple registry of HTTP endpoints that have expressed interest in relaying messages for Cabals.
/// @dev App developers are encouraged to index this registry to find relayers to suggest to their users.
/// @dev Relayers must accept POST requests with fields that represent inputs to the `execute` function on Cabal.sol.
/// @dev The following is an example of the expected JSON body:
/// {
///     "to": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
///     "value": "100",
///     "data": "0x",
///     "proof": {
///         "merkleTreeDepth": "1",
///         "merkleTreeRoot": "15072455385723004728391568434269917452175057560864330595979104241296826134229",
///         "nullifier": "2432130996237736738922540632796572003532507629729510922653082317559646996809",
///         "message": "69848943314708015652928779096508042490479914033865682765724248199363571515457",
///         "scope": "15072455385723004728391568434269917452175057560864330595979104241296826134229",
///         "points": [
///             "9253643536189576673416787934833446412290687892353799441925270320811424332569",
///             "4639448310531163583690642280127964801333901068947968991504911017584625684159",
///             "17412780910599597812549449664930754675144882991091881049066274800374672943243",
///             "18686019750448022010438719239960551255875326361271643510437644039484630091741",
///             "6977317891208811376135795020133830183409625313630152237591508072154345625538",
///             "6912133640063201877411230839992469062036748090458800663678165989521234447685",
///             "5122764367492097026373311562662222008089720170222180155302500782148569896836",
///             "8012666575094120639905556099671748756991010856519229274262864384165833202080"
///         ]
///     }
/// }
contract RelayerRegistry {
    /// @notice The address of the Cabal factory contract.
    address public immutable cabal;

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

    /// @param _cabal Address of the Cabal factory contract.
    constructor(address _cabal) {
        cabal = _cabal;
    }

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
