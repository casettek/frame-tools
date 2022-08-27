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

    function _getHtmlTemplate(uint256 _partIndex) internal pure returns (string memory) {
        string[2] memory htmlWrapper = ['<!DOCTYPE html><html>', '<body style="margin: 0px"></body></html>'];
        string[2] memory headWrapper = ['<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><script type="text/javascript">', '</script></head>'];
        string[2] memory libKeysWrapper = ["const frameKeys=[", '];const importKeys=frameKeys.filter((fk)=>fk!=="gz-utils@1.0.0").reverse();'];
        string[2] memory importsWrapper = [
            'let importData=[];', 
            'imports = imports.reverse(); let importmap = "{"; for (keyIndex in importKeys) { importMap = `"${ frameKeys[keyIndex] }": "data:text/javascript;base64,${btoa(importKeys[keyIndex])}"${ keyIndex < frameKeys.length - 1 ? "," : "" }`; } const script = document.createElement("script"); script.type = "importmap"; script.innerHTML = importmap; document.head.appendChild(script);'];

        if(_partIndex == 0) {
            return string.concat(htmlWrapper[0], headWrapper[0]);
        } else if(_partIndex == 1) {
            return libKeysWrapper[0]; 
        } else if(_partIndex == 2) {
            return string.concat(libKeysWrapper[1], importsWrapper[0]);
        } else if(_partIndex == 3) {
            return string.concat(importsWrapper[1], headWrapper[1]);
        } else {
            return string.concat(htmlWrapper[1]);
        }
    }

    function _compareStrings(string memory _a, string memory _b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((_a))) == keccak256(abi.encodePacked((_b))));
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

        for (uint256 idx = startAtAssetIndex; idx < endAtAssetIndex + 1; idx++) {
            bool idxIsDep = idx + 1 <= depsCount;
            uint256 adjustedIdx = idxIsDep ? idx : idx - depsCount;
            FrameDataStore idxStorage = idxIsDep ? coreDepStorage : assetStorage;
            Asset memory idxAsset = idxIsDep ? depsList[idx] : assetList[adjustedIdx];

            bool idxAtEndAssetIndex = idx == endAtAssetIndex;
            uint256 startPage = idx == startAtAssetIndex ? startAtPage : 0;
            uint256 endPage = idxAtEndAssetIndex
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

            result = string.concat(
                result,
                string(
                    abi.encodePacked(
                        idxStorage.getData(idxAsset.key, startPage, endPage)
                    )
                )
            );

            // If needed, include last part of an asset's wrapper
            bool endingEarly = idxAtEndAssetIndex &&
                endAtPage != idxStorage.getMaxPageNumber(idxAsset.key);

            if (!endingEarly) {
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
                
                // Fill in the gap between gz-utils and imports
                if (
                    _compareStrings(idxAsset.key, "gz-utils@1.0.0") && 
                    endAtPage == idxStorage.getMaxPageNumber(idxAsset.key)
                ) {
                    string memory importKeysJsString = _getHtmlTemplate(1);
                    
                    // Inject a list of import key names to the page
                    for (uint256 dx = 0; dx < depsCount; dx++) {
                        importKeysJsString = string.concat('"', depsList[dx].key, '"');
                        if (dx != depsCount - 1) {
                            importKeysJsString = string.concat(importKeysJsString, ',');
                        }
                    }

                    importKeysJsString = string.concat(importKeysJsString, _getHtmlTemplate(2));
                    result = string.concat(result, importKeysJsString);
                }

                // Completing an asset that's the last import
                if (idx + 1 == depsCount) {
                    result = string.concat(result, _getHtmlTemplate(3));
                }
            }

        }

        if (_rpage == 0) {
            result = string.concat(_getHtmlTemplate(0), result);
        }
        
        if (_rpage == (renderPagesCount - 1)) {
            result = string.concat(result, _getHtmlTemplate(4));
        }

        return result;
    }
}