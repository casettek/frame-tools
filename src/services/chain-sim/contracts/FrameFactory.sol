//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

interface FrameDataStore {
    function saveData(string memory _key, uint128 _pageNumber, bytes memory _b) external;
}

interface FrameDataStoreFactory {
    function createFrameDataStore() external returns (address);
}

interface Frame {
    function init(
        address _coreDepStorage,
        address _assetStorage,
        string[2][] calldata _deps,
        string[2][] calldata _assets,
        uint256[4][] calldata _renderIndex
    ) external;
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
    ) public returns (address)  {
        address clone = createClone(libraryAddress);
        address _assetStorage = _frameDataStoreFactory.createFrameDataStore();

        Frame(clone).init(_coreDepStorage, _assetStorage, _deps, _assets, _renderIndex);
        emit FrameCreated(clone);
        
        return clone;
    }

    // Must be single page source for now. This will limit the size of source that can be used.
    function createFrameWithSources(
        address _coreDepStorage,
        FrameDataStoreFactory _frameDataStoreFactory,
        string[2][] calldata _deps,
        string[2][] calldata _assets,
        bytes[] calldata _assetsData,
        uint256[4][] calldata _renderIndex
    ) public returns (address)  {
        address clone = createClone(libraryAddress);
        address _assetStorage = _frameDataStoreFactory.createFrameDataStore();

        Frame(clone).init(_coreDepStorage, _assetStorage, _deps, _assets, _renderIndex);
        emit FrameCreated(clone);

        for (uint256 adx = 0; adx < _assetsData.length; adx++) {
          FrameDataStore(_assetStorage).saveData(string(_assets[adx][1]), 0, _assetsData[adx]);
        }
        
        return clone;
    }
}