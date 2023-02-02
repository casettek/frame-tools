# Frame

Frame is a framework for publishing [scripty.sol](https://int-art.gitbook.io/scripty.sol/) based HTML NFTs to EVM block space. `FrameDeployer` uses a [clone factory pattern](https://blog.logrocket.com/cloning-solidity-smart-contracts-factory-pattern/) to deploy new artwork/tokens with minimal gas cost in a single transaction.

An example NFT can be found [here](https://testnets.opensea.io/assets/goerli/0x48fFce2Cfd8A132f9Ef3603aF6DDF75938490fBB/0). A user friendly web interface can be found at [frame.tools](https://www.frame.tools/).

## How it Works

Frame is built on top of [scripty.sol](https://int-art.gitbook.io/scripty.sol/) and [ethfs](https://github.com/holic/ethfs). Calling `FrameDeployer.createNewFrameWithScript` will atomically:

- Save the a script to the source request's `contractAddress`. The source request is the last item in `_requests`.
- Create a new `Frame` clone with the required metadata, `ScriptyBuilder` requests, and `DynamicBuffer` size.
- Mint 1 token to `msg.sender`.

The user will be limited in the size of the script when calling `createFrameWithScript`. If a larger source script is needed then users can first store it across multiple chunks in a `ScriptyStorage` contract and then use `FrameDeployer.createFrame`.

`Frame` extends `ERC721Cloneable`, a slight fork of OpenZeppelin's `ERC721` that removes requirement of `name` and `symbol` when deploying. For now, all tokens have a supply of 1 minted on creation to `msg.sender`.

### Ethereum Goerli contracts

|               |                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| FrameDeployer | [0x767b4dE3375cc31de98A48aeFb73A95356D7FC24](https://goerli.etherscan.io/address/0x767b4dE3375cc31de98A48aeFb73A95356D7FC24) |
| Frame         | [0x131074bD52A90Bd02D42D923C5328dc057e057cb](https://goerli.etherscan.io/address/0x131074bD52A90Bd02D42D923C5328dc057e057cb) |
| FrameFactory  | [0x64698bdB11c8b6Bb56d6dB7c8183debB64d241E1](https://goerli.etherscan.io/address/0x64698bdB11c8b6Bb56d6dB7c8183debB64d241E1) |

## Author

[@caszete](https://twitter.com/caszete)

## Credit

- [Scripty.sol](https://int-art.gitbook.io/scripty.sol/) - [@0xthedude](https://twitter.com/0xthedude) [@xtremetom](https://twitter.com/xtremetom)
- [EthFS](https://github.com/holic/ethfs) - [@frolic](https://twitter.com/frolic)
- DynamicBuffer - [@cxkoda](https://twitter.com/cxkoda)
