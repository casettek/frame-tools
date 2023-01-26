// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./libs/erc721-cloneable/ERC721Cloneable.sol";
import "solady/src/utils/Base64.sol";
import {IScriptyBuilder, WrappedScriptRequest} from "./libs/scripty/IScriptyBuilder.sol";

struct FrameMetadata {
    string encodedName;    
    string encodedDescription;
}

contract Frame is ERC721Cloneable {
    bool public initialized;
    bool public minted;
    string public urlEncodedName;
    string public urlEncodedDesc;
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
      urlEncodedName = _metadata.encodedName;
      urlEncodedDesc = _metadata.encodedDescription;
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

      // bytes memory doubleURLEncodedHTMLDataURI = IScriptyBuilder(scriptyBuilderAddress)
      //     .getHTMLWrappedURLSafe(requests, bufferSize);

      bytes memory metadata = abi.encodePacked(
          '{"name":"', // data:application/json,{name":"
          urlEncodedName,
          '", "description":"', // ,"description":"
          urlEncodedDesc,
          '","animation_url":', // ,"animation_url":"
          // doubleURLEncodedHTMLDataURI,
          '"}' // "}
      );

      return
          string(
              abi.encodePacked(
                  "data:application/json;base64,",
                  Base64.encode(metadata)
              )
          );
    }
}
