//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface FrameDataStore {
    function getData(
        string memory _key,
        uint256 _startPage,
        uint256 _endPage
    ) external view returns (bytes memory);

    function getMaxPageNumber(string memory _key)
        external
        view
        returns (uint256);

    function getAllDataFromPage(
        string memory _key,
        uint256 _startPage
    ) external view returns (bytes memory);
}

contract Frame {
    struct Asset {
        string wrapperKey;
        string key;
    }

    string public name = "";
    bool public initSuccess = false;

    FrameDataStore public coreDepStorage;
    FrameDataStore public assetStorage;
    
    mapping(uint256 => Asset) public depsList;
    uint256 public depsCount;

    mapping(uint256 => Asset) public assetList;
    uint256 public assetsCount;

    uint256 public renderPagesCount;
    mapping(uint256 => uint256[4]) public renderIndex;

    string[2] public htmlWrapper = ['<!DOCTYPE html><html>', '</html>'];
    string[2] public headWrapper = ['<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><script type="text/javascript">', '</script></head>'];
    string[2] public bodyWrapper = ['<body style="margin: 0px">', '</body>'];
    string[2] public libKeysWrapper = ["const fks=[", '];const iks = fks.filter((fk) => !fk.includes("frame-utils"));'];
    string[2] public importMapWrapper = [
        'let idata = [];', 
        'let imap = `{ "imports": { `; for (ki in iks) { imap = imap + `"${ iks[ki].split("@")[0] }": "data:text/javascript;base64,${btoa(idata[ki])}"${ ki < (iks.length - 1) ? "," : "" }`; } imap = imap + "} }"; const s = document.createElement("script"); s.type = "importmap"; s.innerHTML = imap; document.head.appendChild(s);'];

    constructor() {}

    function init(
        address _coreDepStorage,
        address _assetStorage,
        string[2][] calldata _deps,
        string[2][] calldata _assets,
        uint256[4][] calldata _renderIndex
    ) public {
        require(!initSuccess, "Frame: Can't re-init contract");

        _setCoreDepStorage(FrameDataStore(_coreDepStorage));
        _setAssetStorage(FrameDataStore(_assetStorage));
        _setDeps(_deps);
        _setAssets(_assets);
        _setRenderIndex(_renderIndex);

        initSuccess = true;
    }

    function setName(string memory _name) public {
        require(bytes(name).length < 3, "Frame: Name already set");
        name = _name;
    }

    // Internal 

    function _setDeps(string[2][] calldata _deps) internal {
        for (uint256 dx; dx < _deps.length; dx++) {
            depsList[dx] = Asset({ wrapperKey: _deps[dx][0], key: _deps[dx][1] });
            depsCount++;
        }
    }

    function _setAssets(string[2][] calldata _assets) internal {
        for (uint256 ax; ax < _assets.length; ax++) {
            assetList[ax] = Asset({ wrapperKey: _assets[ax][0], key: _assets[ax][1] });
            assetsCount++;
        }
    }

    function _setCoreDepStorage(FrameDataStore _storage) internal {
        coreDepStorage = _storage;
    }

    function _setAssetStorage(FrameDataStore _storage) internal {
        assetStorage = _storage;
    }

    function _setRenderIndex(uint256[4][] calldata _index) internal {
        for (uint256 idx; idx < _index.length; idx++) {
            renderPagesCount++;
            renderIndex[idx] = _index[idx];
        }
        renderPagesCount = _index.length;
    }

    function _compareStrings(string memory _a, string memory _b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((_a))) == keccak256(abi.encodePacked((_b))));
    }

    function _contains(string memory what, string memory where) internal pure returns (bool) {
        bytes memory whatBytes = bytes (what);
        bytes memory whereBytes = bytes (where);

        require(whereBytes.length >= whatBytes.length);

        bool found = false;
        for (uint i = 0; i <= whereBytes.length - whatBytes.length; i++) {
            bool flag = true;
            for (uint j = 0; j < whatBytes.length; j++)
                if (whereBytes [i + j] != whatBytes [j]) {
                    flag = false;
                    break;
                }
            if (flag) {
                found = true;
                break;
            }
        }
        return found;
    }

    // Read-only

    function renderPage(uint256 _rpage) public view returns (string memory) {
        // Index item format: [startAsset, endAsset, startAssetPage, endAssetPage]
        uint256[4] memory indexItem = renderIndex[_rpage];
        uint256 startAtAssetIndex = indexItem[0];
        uint256 endAtAssetIndex = indexItem[1];
        uint256 startAtPage = indexItem[2];
        uint256 endAtPage = indexItem[3];
        string memory result = "";

        // Iterate over assets in the index item
        for (uint256 idx = startAtAssetIndex; idx <= endAtAssetIndex; idx++) {
            bool isIdxDep = idx + 1 <= depsCount;

            // Adjust local index backwards if moving on to asset storage 
            uint256 adjustedIdx = isIdxDep ? idx : idx - depsCount;
            FrameDataStore idxStorage = isIdxDep ? coreDepStorage : assetStorage;
            Asset memory idxAsset = isIdxDep ? depsList[idx] : assetList[adjustedIdx];

            bool isIdxAtEndAssetIndex = idx == endAtAssetIndex;
            uint256 startPage = idx == startAtAssetIndex ? startAtPage : 0;
            uint256 endPage = isIdxAtEndAssetIndex
                ? endAtPage
                : idxStorage.getMaxPageNumber(idxAsset.key);

            // If starting at zero, include first part of an asset's wrapper
            if (startPage == 0) {
                result = string.concat(
                    result, 
                    string(
                        abi.encodePacked(
                            coreDepStorage.getData(idxAsset.wrapperKey, 0, 0)
                        )
                    )
                );
            }
            
            // Fill data from asset page range
            result = string.concat(
                result,
                string(
                    abi.encodePacked(
                        idxStorage.getData(idxAsset.key, startPage, endPage)
                    )
                )
            );            

            // Will not get the last page of the asset
            bool willCompleteAsset = endAtPage == idxStorage.getMaxPageNumber(idxAsset.key);
            bool isIdxLastDep = isIdxDep && idx == depsCount - 1;
            bool isGzUtils = _contains("frame-utils", idxAsset.key);

            // If needed, include last part of an asset's wrapper
            if (willCompleteAsset) {
                result = string.concat(
                    result, 
                    string(
                        abi.encodePacked(
                            coreDepStorage.getData(
                                idxAsset.wrapperKey, 1, 1
                            )
                        )
                    )
                );

                // Finishing gz-utils, with a import map asset next
                if (isGzUtils && !isIdxLastDep && _contains("importmap", depsList[idx + 1].wrapperKey)) {
                    string memory importKeysJsString = libKeysWrapper[0];
                    
                    // Inject a list of import key names to the page
                    for (uint256 dx = 0; dx < depsCount; dx++) {
                        importKeysJsString = string.concat('"', depsList[dx].key, '"');
                        if (dx != depsCount - 1) {
                            importKeysJsString = string.concat(importKeysJsString, ',');
                        }
                    }

                    importKeysJsString = string.concat(importKeysJsString, string.concat(libKeysWrapper[1], importMapWrapper[0]));
                } 
                
                // Finishing deps
                if (isIdxLastDep) {
                    if(_contains("importmap", idxAsset.wrapperKey)){
                        result = string.concat(result, string.concat(importMapWrapper[1], headWrapper[1]), bodyWrapper[0]);
                    } else {
                        result = string.concat(result, headWrapper[1], bodyWrapper[0]);
                    }
                    
                }
            }

        }

        if (_rpage == 0) {
            result = string.concat(string.concat(htmlWrapper[0], headWrapper[0]), result);
        }
        
        if (_rpage == (renderPagesCount - 1)) {
            result = string.concat(result, string.concat(bodyWrapper[1], htmlWrapper[1]));
        }

        return result;
    }
}