// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./libs/erc721-cloneable/ERC721Cloneable.sol";
import "solady/src/utils/Base64.sol";
import {IScriptyBuilder, WrappedScriptRequest} from "./libs/scripty/IScriptyBuilder.sol";

struct FrameMetadata {
    string name;    
    string description;
    string symbol;
}

contract Frame is ERC721Cloneable {
    bool public initialized;
    bool public minted;

    string public description;
    address public scriptyBuilderAddress;
    uint256 public bufferSize;
    WrappedScriptRequest[] public requests;

    constructor() ERC721Cloneable() {}

    function mintForOwner(address _owner) public {
      require(!minted, "Frame: Already minted");
      _safeMint(_owner, 0);
      minted = true;
    }

    function init(
      FrameMetadata calldata _metadata,
      address _scriptyBuilderAddress,
      uint256 _bufferSize,
      WrappedScriptRequest[] calldata _requests
    ) public {
      require(!initialized, "Frame: already initialized");
      setName(_metadata.name);
      setSymbol(_metadata.symbol);

      description = _metadata.description;
      scriptyBuilderAddress = _scriptyBuilderAddress;
      bufferSize = _bufferSize;
      for (uint i = 0; i < _requests.length; i++) {
          requests.push(_requests[i]);
      }
      initialized = true;
    }

    function tokenURI(
      uint256 /*_tokenId*/
    ) public view virtual override returns (string memory) {

      bytes memory dataURI = IScriptyBuilder(scriptyBuilderAddress).getHTMLWrappedURLSafe(requests, bufferSize);

      bytes memory metadata = abi.encodePacked(
          '{"name":"',
          name(),
          '", "description":"',
          description,
          '","animation_url":"',
          dataURI,
          '"}'
      );

      return
          string(
              abi.encodePacked(
                  "data:application/json,",
                  metadata
              )
          );
    }
}
