// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./libs/erc721-cloneable/ERC721Cloneable.sol";
import "solady/src/utils/Base64.sol";
import {IScriptyBuilder, WrappedScriptRequest} from "./libs/scripty/IScriptyBuilder.sol";

contract Frame is ERC721Cloneable {
    address public scriptyStorageAddress;
    address public scriptyBuilderAddress;
    uint256 public bufferSize;
    WrappedScriptRequest[] public requests;

    constructor() ERC721Cloneable() {}

    function mint() internal {
        _safeMint(msg.sender, 0);
    }

    function mintIdForOwner(uint _id, address _owner) public {
        _safeMint(_owner, _id);
    }

    function setParams(
        address _scriptyStorageAddress,
        address _scriptyBuilderAddress,
        uint256 _bufferSize,
        WrappedScriptRequest[] memory _requests
    ) public {
        scriptyStorageAddress = _scriptyStorageAddress;
        scriptyBuilderAddress = _scriptyBuilderAddress;
        bufferSize = _bufferSize;
        for (uint i = 0; i < _requests.length; i++) {
            requests.push(_requests[i]);
        }
    }

    function tokenURI(
        uint256 /*_tokenId*/
    ) public view virtual override returns (string memory) {

        bytes memory doubleURLEncodedHTMLDataURI = IScriptyBuilder(scriptyBuilderAddress)
            .getHTMLWrappedURLSafe(requests, bufferSize);

        return
            string(
                abi.encodePacked(
                    "data:application/json,",
                    // url encoded once
                    // {"name":"Cube3D - GZIP Compressed - URL Safe", "description":"Assembles GZIP compressed base64 encoded three.js with a demo scene. Metadata and animation URL are both URL encoded.","animation_url":"
                    "%7B%22name%22%3A%22Cube3D%20-%20GZIP%20Compressed%20-%20URL%20Safe%22%2C%20%22description%22%3A%22Assembles%20GZIP%20compressed%20base64%20encoded%20three.js%20with%20a%20demo%20scene.%20Metadata%20and%20animation%20URL%20are%20both%20URL%20encoded.%22%2C%22animation_url%22%3A%22",
                    doubleURLEncodedHTMLDataURI,
                    // url encoded once
                    // "}
                    "%22%7D"
                )
            );
    }
}
