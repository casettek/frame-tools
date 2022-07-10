//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import './Frame.sol';
import './CloneFactory.sol';

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