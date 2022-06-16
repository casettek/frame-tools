//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IContractStorage {
    function getData(
        string memory _key,
        uint256 _startPage,
        uint256 _endPage
    ) external view returns (bytes memory);

    function getMaxPageNumber(string memory _key)
        external
        view
        returns (uint256);
}

contract Renderer {
    struct Asset {
        string key;
        string[2] wrapper;
        uint256 maxPageNumber;
    }

    IContractStorage public assetStorage;

    // string[2] public renderWrapper = [
    //     '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head><body>',
    //     "<div></div></body></html>"
    // ];
    string[2] public renderWrapper = {{=it.renderWrapper}};
    mapping(uint256 => Asset) public assetList;
    uint256 public renderPagesCount;
    mapping(uint256 => uint256[4]) public renderIndex;

    constructor() {}

    function setAssets() public {
        {{=it.wrappers}}
        {{=it.assetList}}
        
        // string[2] memory rawJSWrapper = ["<script>", "</script>"];
        string[2] memory rawJSWrapper = {{=it.rawJSWrapper}};

        // string[2] memory b64JSEvalWrapper = [
        //     "<script>eval(atob('",
        //     "'));</script>"
        // ];
        string[2] memory b64JSEvalWrapper = {{=it.b64JSEvalWrapper}};
        // string[2] memory hexAssetWrapper = [
        //     "<script>window._assets = (window._assets||[]).concat(window.fflate.strFromU8(window.fflate.decompressSync(window.hexStringToArrayBuffer('",
        //     "'))));</script>"
        // ];
        string[2] memory hexAssetWrapper = {{=it.hexAssetWrapper}};

        assetList[0] = Asset(
            "compressorGlobalB64",
            b64JSEvalWrapper,
            assetStorage.getMaxPageNumber("compressorGlobalB64")
        );
        assetList[1] = Asset(
            "p5gzhex",
            hexAssetWrapper,
            assetStorage.getMaxPageNumber("p5gzhex")
        );
        assetList[2] = Asset(
            "p5setup",
            rawJSWrapper,
            assetStorage.getMaxPageNumber("p5setup")
        );
        assetList[3] = Asset(
            "draw",
            rawJSWrapper,
            assetStorage.getMaxPageNumber("draw")
        );
    }

    // Utils
    function ceil(uint256 a, uint256 m) public pure returns (uint256) {
        return ((a + m - 1) / m) * m;
    }

    function setAssetStorage(IContractStorage _storage) public {
        assetStorage = _storage;
    }

    function setRenderIndex(uint256[4][] memory _index) public {
        for (uint256 idx; idx < _index.length; idx++) {
            renderPagesCount++;
            renderIndex[idx] = _index[idx];
        }
        renderPagesCount = _index.length;
    }

    function getRenderIndexItem(uint256 _index)
        public
        view
        returns (uint256[4] memory)
    {
        return renderIndex[_index];
    }

    function renderPage(uint256 _rpage) public view returns (string memory) {
        // [startAsset, endAsset, startAssetPage, endAssetPage
        uint256[4] memory indexItem = renderIndex[_rpage];
        uint256 startAtAsset = indexItem[0];
        uint256 endAtAsset = indexItem[1];
        uint256 startAtPage = indexItem[2];
        uint256 endAtPage = indexItem[3];

        string memory result = "";
        for (uint256 idx = startAtAsset; idx < endAtAsset + 1; idx++) {
            bool idxIsAtStart = idx == startAtAsset;
            Asset memory idxAsset = assetList[idx];
            uint256 startPage = idx == startAtAsset ? startAtPage : 0;
            uint256 endPage = idx == endAtAsset
                ? endAtPage
                : idxAsset.maxPageNumber;

            // If starting at zero, include first part of an asset's wrapper
            if (startPage == 0) {
                result = string.concat(result, idxAsset.wrapper[0]);
            }

            result = string.concat(
                result,
                string(
                    abi.encodePacked(
                        assetStorage.getData(idxAsset.key, startPage, endPage)
                    )
                )
            );

            // If needed, include last part of an asset's wrapper
            bool endingEarly = idx == endAtAsset &&
                endAtPage != idxAsset.maxPageNumber;
            if (!endingEarly) {
                result = string.concat(result, idxAsset.wrapper[1]);
            }
        }

        if (_rpage == 0) {
            return string.concat(renderWrapper[0], result);
        } else if (_rpage == renderPagesCount) {
            return string.concat(result, renderWrapper[1]);
        }

        return result;
    }
}
