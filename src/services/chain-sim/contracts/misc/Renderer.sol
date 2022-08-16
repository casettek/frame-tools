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
        string assetType;
        string key;
        string[2] wrapper;
        uint256 maxPageNumber;
    }

    IContractStorage public assetStorage;

    string[2] public renderWrapper = [
        '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head><body>',
        "<div></div></body></html>"
    ];
    mapping(uint256 => Asset) public assetList;
    uint256 public renderPagesCount;
    mapping(uint256 => uint256[4]) public renderIndex;

    constructor() {}

    function setAssets() public {
        // Set project's asset storage. Two types of storage, imports and exports
        // assetStorage = _storage;

        // Most of developer's custom code will be here, where
        // we either import third-party modules or write out own

        // Rendering is all dependent on what you write here, and how you
        // order things if they depend on each other
        // maxRenderPageSize = 5;

        string[2] memory rawJSWrapper = ["<script>", "</script>"];

        string[2] memory b64JSEvalWrapper = [
            "<script>eval(atob('",
            "'));</script>"
        ];
        string[2] memory hexAssetWrapper = [
            "<script>window._assets = (window._assets||[]).concat(window.fflate.strFromU8(window.fflate.decompressSync(window.hexStringToArrayBuffer('",
            "'))));</script>"
        ];

        assetList[0] = Asset(
            "b64jseval",
            "compressorGlobalB64",
            b64JSEvalWrapper,
            assetStorage.getMaxPageNumber("compressorGlobalB64")
        );
        assetList[1] = Asset(
            "gzhexjs",
            "p5gzhex",
            hexAssetWrapper,
            assetStorage.getMaxPageNumber("p5gzhex")
        );
        assetList[2] = Asset(
            "rawjs",
            "p5setup",
            rawJSWrapper,
            assetStorage.getMaxPageNumber("p5setup")
        );
        assetList[3] = Asset(
            "rawjs",
            "draw",
            rawJSWrapper,
            assetStorage.getMaxPageNumber("draw")
        );
        // assetList[2] = Asset(
        //     "gzhexjs",
        //     "flower1hex",
        //     hexAssetWrapper,
        //     assetStorage.getMaxPageNumber("flower1hex")
        // );
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

    function render(uint256 _tokenId) public view returns (string memory) {
        string memory compressor = string.concat(
            "<script>eval(atob('",
            string(
                abi.encodePacked(
                    assetStorage.getData("compressorGlobalB64", 0, 0)
                )
            ),
            "'));</script>"
        );

        string memory d3 = string.concat(
            "<script>window._assets = (window._assets||[]).concat(window.fflate.strFromU8(window.fflate.decompressSync(window.hexStringToArrayBuffer('",
            string(abi.encodePacked(assetStorage.getData("d3topogzhex", 0, 0))),
            "'))));</script>"
        );

        string memory flower = string.concat(
            "<script>window._assets = (window._assets||[]).concat(window.fflate.strFromU8(window.fflate.decompressSync(window.hexStringToArrayBuffer('",
            string(abi.encodePacked(assetStorage.getData("flower1hex", 0, 0))),
            "'))));</script>"
        );

        string memory init1 = "<script>eval(window._assets[0]);</script>";
        string
            memory init2 = '<script>var colors = [ "#fcde9c", "#faa476", "#f0746e", "#e34f6f", "#dc3977", "#b9257a", "#7c1d6f", ]; var topology = JSON.parse(window._assets[1]); var width = 5000, height = 5000; var path = geoPath(); var svg = select("body") .append("svg") .attr("width", width) .attr("height", height); var geojson = feature(topology, topology.objects["basic2-geo"]); console.log("geojson", geojson); svg .selectAll("path") .data(geojson.features) .enter() .append("path") .attr("d", path) .attr("fill", function () { return colors[Math.round(Math.random() * 6)]; }); function changeColor() { svg .selectAll("path") .transition() .duration(window.gsint || 1000) .attr("fill", function () { return colors[Math.round(Math.random() * 6)]; }); }</script>';

        return
            string.concat(
                '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head><body>',
                compressor,
                // p5,
                d3,
                flower,
                init1,
                init2,
                "<div></div></body></html>"
            );
    }

    function example(uint256 _id) external view returns (string memory) {
        return render(_id);
    }
}
