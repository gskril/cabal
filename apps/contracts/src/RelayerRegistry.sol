// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @notice A simple registry of HTTP endpoints that have expressed interest in relaying messages for Cabals.
/// @dev App developers are encouraged to index this registry to find relayers to suggest to their users.
/// @dev Relayers must accept POST requests with fields that represent inputs to the `execute` function on Cabal.sol.
/// @dev The following is an example of the expected JSON body:
/// {
///     "to": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
///     "value": "1000",
///     "data": "0x",
///     "chainId": "31337",
///     "proof": {
///         "merkleTreeDepth": "1",
///         "merkleTreeRoot": "15072455385723004728391568434269917452175057560864330595979104241296826134229",
///         "nullifier": "2432130996237736738922540632796572003532507629729510922653082317559646996809",
///         "message": "71449365241074709419469110251443098840852445887414443790693493183138548466850",
///         "scope": "15072455385723004728391568434269917452175057560864330595979104241296826134229",
///         "points": [
///             "10082539395460993945227192553075930100508716116137228739257368835107668955174",
///             "21874329518966965217302373148366076300303084191794267688356202532475212099715",
///             "3680969181725311038746941834387221051903733686814300140723063452866481210276",
///             "15495033016412668925928800268419645107126789054361719249293365148798416760028",
///             "1895309130967631350082715688031480016365832927156669288165775898275491802002",
///             "11282804402855397579124242445779041193835121508448362287173509878987753562605",
///             "14635423188485829860316619173274199718514106842931200029348121531203127470295",
///             "9097188558659260734894144232002616995191505592454694265394268656263289559883"
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
