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
}

interface FrameDataStoreFactory {
    function createFrameDataStore() external returns (address);
}

contract CloneFactory {
  function createClone(address target) internal returns (address result) {
    bytes20 targetBytes = bytes20(target);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(clone, 0x14), targetBytes)
      mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      result := create(0, clone, 0x37)
    }
  }

  function isClone(address target, address query) internal view returns (bool result) {
    bytes20 targetBytes = bytes20(target);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x363d3d373d3d3d363d7300000000000000000000000000000000000000000000)
      mstore(add(clone, 0xa), targetBytes)
      mstore(add(clone, 0x1e), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

      let other := add(clone, 0x40)
      extcodecopy(query, other, 0, 0x2d)
      result := and(
        eq(mload(clone), mload(other)),
        eq(mload(add(clone, 0xd)), mload(add(other, 0xd)))
      )
    }
  }
}

contract Frame {
    struct Asset {
        string assetType;
        string key;
    }

    FrameDataStore public coreDepStorage;
    FrameDataStore public assetStorage;
    
    mapping(uint256 => Asset) public depsList;
    uint256 public depsCount;

    mapping(uint256 => Asset) public assetList;

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
        setCoreDepStorage(FrameDataStore(_coreDepStorage));
        setAssetStorage(FrameDataStore(_assetStorage));
        setDeps(_deps);
        setAssets(_assets);
        setRenderIndex(_renderIndex);
    }

    function setDeps(string[2][] calldata _deps) public {
        for (uint256 dx; dx < _deps.length; dx++) {
            depsList[dx] = Asset(_deps[dx][0], _deps[dx][1]);
            depsCount++;
        }
    }

    function setAssets(string[2][] calldata _assets) public {
        for (uint256 ax; ax < _assets.length; ax++) {
            assetList[ax] = Asset(_assets[ax][0], _assets[ax][1]);
        }
    }

    function setCoreDepStorage(FrameDataStore _storage) public {
        coreDepStorage = _storage;
    }

    function setAssetStorage(FrameDataStore _storage) public {
        assetStorage = _storage;
    }

    function setRenderIndex(uint256[4][] calldata _index) public {
        for (uint256 idx; idx < _index.length; idx++) {
            renderPagesCount++;
            renderIndex[idx] = _index[idx];
        }
        renderPagesCount = _index.length;
    }

    function renderPage(uint256 _rpage) public view returns (string memory) {
        // [startAsset, endAsset, startAssetPage, endAssetPage]
        uint256[4] memory indexItem = renderIndex[_rpage];
        uint256 startAtAsset = indexItem[0];
        uint256 endAtAsset = indexItem[1];
        uint256 startAtPage = indexItem[2];
        uint256 endAtPage = indexItem[3];
        string memory result = "";

        for (uint256 idx = startAtAsset; idx < endAtAsset + 1; idx++) {
            bool idxIsDep = idx + 1 <= depsCount;
            FrameDataStore idxStorage = idxIsDep ? coreDepStorage : assetStorage;
            Asset memory idxAsset = idxIsDep ? depsList[idx] : assetList[idx];

            uint256 startPage = idx == startAtAsset ? startAtPage : 0;
            uint256 endPage = idx == endAtAsset
                ? endAtPage
                : idxStorage.getMaxPageNumber(idxAsset.key);

            // If starting at zero, include first part of an asset's wrapper
            if (startPage == 0) {
                result = string.concat(result, string(coreDepStorage.getData(string.concat(idxAsset.assetType, "Wrapper"), 0, 0)));
            }

            result = string.concat(
                result,
                string(
                    abi.encodePacked(
                        coreDepStorage.getData(idxAsset.key, startPage, endPage)
                    )
                )
            );

            // If needed, include last part of an asset's wrapper
            bool endingEarly = idx == endAtAsset &&
                endAtPage != idxStorage.getMaxPageNumber(idxAsset.key);
            if (!endingEarly) {
                result = string.concat(result, string(coreDepStorage.getData(string.concat(idxAsset.assetType, "Wrapper"), 1, 1)));
            }
        }

        if (_rpage == 0) {
            return string.concat(string(coreDepStorage.getData("renderWrapper", 0, 0)), result);
        } else if (_rpage == renderPagesCount) {
            return string.concat(result, string(coreDepStorage.getData("renderWrapper", 1, 1)));
        }

        return result;
    }
}

contract FrameFactory is CloneFactory {
    address public libraryAddress;

    event FrameCreated(address newAddress);

    constructor() {}

    function setLibraryAddress(address _libraryAddress) public  {
      libraryAddress = _libraryAddress;
  }

    function createFrame(
        address _coreDepStorage,
        FrameDataStoreFactory _frameDataStoreFactory,
        string[2][] calldata _deps,
        string[2][] calldata _assets,
        uint256[4][] calldata _renderIndex
    ) public  {
        address clone = createClone(libraryAddress);
        address _assetStorage = _frameDataStoreFactory.createFrameDataStore();

        Frame(clone).init(_coreDepStorage, _assetStorage, _deps, _assets, _renderIndex);
        emit FrameCreated(clone);
    }
}