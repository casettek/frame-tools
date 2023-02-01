# Frame

Frame is a framework for publishing [scripty.sol](https://int-art.gitbook.io/scripty.sol/) based HTML NFTs to EVM block space. `FrameDeployer` uses a [clone factory pattern](https://blog.logrocket.com/cloning-solidity-smart-contracts-factory-pattern/) to deploy new artwork/tokens with minimal gas cost in a single transaction.

An example NFT can be found [here](https://testnets.opensea.io/assets/goerli/0x031b8dbbab4e7c358b1edcd52eae1cec9234dc7e/0).

## How it Works

Frame is built on top of [scripty.sol](https://int-art.gitbook.io/scripty.sol/) and [ethfs](https://github.com/holic/ethfs). Calling `FrameDeployer.createNewFrameWithScript` will atomically:

- Create a new `ScriptyStorage` clone using a new `ContentStore` clone
- Create a new `Frame` clone with the required metadata, `ScriptyBuilder` requests, and `DynamicBuffer` size
- Mint 1 token to `msg.sender`

The user will be limited in the size of the script when calling `createFrameWithScript`. If a larger source script is needed then users can first store it across multiple chunks in a `ScriptyStorage` contract and then use `FrameDeployer.createFrame`.

`Frame` extends `ERC721Cloneable`, a slight fork of OpenZeppelin's `ERC721` that require `name` and `symbol` when deploying. For now, all tokens have a supply of 1 minted on creation to `msg.sender`.

## Author

[@caszete](https://twitter.com/caszete)

## Credit

- [Scripty.sol](https://int-art.gitbook.io/scripty.sol/) - [@0xthedude](https://twitter.com/0xthedude) [@xtremetom](https://twitter.com/xtremetom)
- [EthFS](https://github.com/holic/ethfs) - [@frolic](https://twitter.com/frolic)
- DynamicBuffer - [@cxkoda](https://twitter.com/cxkoda)
