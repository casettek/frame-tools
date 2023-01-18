// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "solady/src/utils/Base64.sol";

import {IScriptyBuilder, WrappedScriptRequest} from "./scripty/IScriptyBuilder.sol";

contract ScriptyFrame is ERC721 {
    address public immutable scriptyStorageAddress;
    address public immutable scriptyBuilderAddress;
    uint256 public immutable bufferSize;
    WrappedScriptRequest[] public requests;

    constructor(
        address _scriptyStorageAddress,
        address _scriptyBuilderAddress,
        uint256 _bufferSize,
        WrappedScriptRequest[] memory _requests
    ) ERC721("frame", "FRM") {
        scriptyStorageAddress = _scriptyStorageAddress;
        scriptyBuilderAddress = _scriptyBuilderAddress;
        bufferSize = _bufferSize;
        for (uint256 i = 0; i < requests.length; i++) {
          requests[i] = _requests[i];
        }
        mint();
    }

    function mint() internal {
        _safeMint(msg.sender, 0);
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

    // Just for testing
    // solc-ignore-next-line func-mutability
    function tokenURI_ForGasTest() public {
        tokenURI(0);
    }
}
