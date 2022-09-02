//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IFrameDataStore {
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

    IFrameDataStore public coreDepStorage;
    IFrameDataStore public assetStorage;
    
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

        _setCoreDepStorage(IFrameDataStore(_coreDepStorage));
        _setAssetStorage(IFrameDataStore(_assetStorage));
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

    function _setCoreDepStorage(IFrameDataStore _storage) internal {
        coreDepStorage = _storage;
    }

    function _setAssetStorage(IFrameDataStore _storage) internal {
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

    function _isImportmapWrapperString(string memory _a) internal pure returns (bool) {
        return _compareStrings(_a, "b64-gz-importmap-wrap.js@1.0.0");
    }

    function _isAssetDep(uint256 _index) internal view returns (bool) {
        return _index < depsCount;
    }

    function _getAssetWithWrapperString(
        IFrameDataStore _assetStorage,
        IFrameDataStore _wrapperStorage,
        Asset memory _asset, 
        uint256 _fromPage, 
        uint256 _toPage
    ) internal view returns (string memory) {
        string memory result = "";
        if (_fromPage == 0) {
            result = string(
                abi.encodePacked(
                    _wrapperStorage.getData(_asset.wrapperKey, 0, 0)
                )
            );
        }
        result = string.concat(
            result,
            string(
                abi.encodePacked(
                    _assetStorage.getData(_asset.key, _fromPage, _toPage)
                )
            )
        );
        if (_toPage == _assetStorage.getMaxPageNumber(_asset.key)) {
            result = string.concat(
                result,
                string(
                    abi.encodePacked(
                        _wrapperStorage.getData(_asset.wrapperKey, 1, 1)
                    )
                )
            );
        }
        return result;
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
        for (uint256 idx = startAtAssetIndex; idx < endAtAssetIndex + 1; idx++) {
            bool isIdxDep = _isAssetDep(idx);

            // Adjust local index backwards if moving on to asset storage 
            uint256 adjustedIdx = isIdxDep ? idx : idx - depsCount;
            IFrameDataStore idxStorage = isIdxDep ? coreDepStorage : assetStorage;
            Asset memory idxAsset = isIdxDep ? depsList[idx] : assetList[adjustedIdx];

            bool isIdxAtEndAssetIndex = idx == endAtAssetIndex;
            uint256 startPage = idx == startAtAssetIndex ? startAtPage : 0;
            uint256 endPage = isIdxAtEndAssetIndex
                ? endAtPage
                : idxStorage.getMaxPageNumber(idxAsset.key);

            string memory newStuff = _getAssetWithWrapperString(idxStorage, coreDepStorage, idxAsset, startPage, endPage);
            result = string.concat(result, newStuff);

            // Finishing gz-utils, with an import map asset next
            bool isIdxLastDep = isIdxDep && idx == (depsCount - 1);
            bool hasCompletedAsset = endPage == idxStorage.getMaxPageNumber(idxAsset.key);

            if (_compareStrings("fflate.umd.js@0.7.3", idxAsset.key) && hasCompletedAsset) {
              if (isIdxLastDep) {
                result = string.concat(
                    result, 
                    string(
                        abi.encodePacked(
                            coreDepStorage.getData("head-wrap.html@1.0.0", 1, 1),
                            coreDepStorage.getData("body-wrap.html@1.0.0", 0, 0)
                        )
                    )
                );
              } else {
                if (_isImportmapWrapperString(depsList[idx + 1].wrapperKey)) {
                  string memory importKeysJsString = string(
                      abi.encodePacked(
                          coreDepStorage.getData("import-keys-wrap.js@1.0.0", 0, 0)
                      )
                  );

                  // Inject a list of import key names to the page
                  for (uint256 dx = 0; dx < depsCount; dx++) {
                      importKeysJsString = string.concat(
                          string.concat(importKeysJsString, '"'), 
                          string.concat(depsList[dx].key, '"')
                      );

                      if (dx != depsCount - 1) {
                          importKeysJsString = string.concat(importKeysJsString, ',');
                      }
                  }

                  importKeysJsString = string.concat(
                      string.concat(
                          importKeysJsString, 
                          string(
                              abi.encodePacked(
                                  coreDepStorage.getData("import-keys-wrap.js@1.0.0", 1, 1)
                              )
                          )
                      ),
                      string(
                          abi.encodePacked(
                              coreDepStorage.getData("importmap-init-wrap.js@1.0.0", 0, 0)
                          )
                      )
                  );

                  result = string.concat(result, importKeysJsString);
                }
              }
            }
            
            // Finishing deps
            if (isIdxLastDep && hasCompletedAsset) {
                if(_isImportmapWrapperString(idxAsset.wrapperKey)){
                    result = string.concat(
                        result, 
                        string(
                            abi.encodePacked(
                                coreDepStorage.getData("importmap-init-wrap.js@1.0.0", 1, 1),
                                coreDepStorage.getData("head-wrap.html@1.0.0", 1, 1),
                                coreDepStorage.getData("body-wrap.html@1.0.0", 0, 0)
                            )
                        )
                    );
                } else {
                    result = string.concat(
                        result, 
                        string(
                            abi.encodePacked(
                                coreDepStorage.getData("head-wrap.html@1.0.0", 1, 1),
                                coreDepStorage.getData("body-wrap.html@1.0.0", 0, 0)
                            )
                        )
                    );
                }
                
            }

        }

        if (_rpage == 0) {
            result = string.concat(
                string(
                    abi.encodePacked(
                        coreDepStorage.getData("html-wrap.html@1.0.0", 0, 0),
                        coreDepStorage.getData("head-wrap.html@1.0.0", 0, 0)
                    )
                ),
            result);
        }
        
        if (_rpage == (renderPagesCount - 1)) {
            result = string.concat(
                result,
                string(
                    abi.encodePacked(
                        coreDepStorage.getData("body-wrap.html@1.0.0", 1, 1), 
                        coreDepStorage.getData("html-wrap.html@1.0.0", 1, 1)
                    )
                )
            );
        }

        return result;
    }
}