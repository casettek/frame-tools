//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import './CloneFactory.sol';

contract FrameDataStoreFactory is CloneFactory {
  address public libraryAddress;

  event FrameDataStoreCreated(address newAddress);

  constructor() {}

  function setLibraryAddress(address _libraryAddress) public  {
      libraryAddress = _libraryAddress;
  }

  function createFrameDataStore() public returns (address)  {
    address clone = createClone(libraryAddress);
    emit FrameDataStoreCreated(clone);
    return clone;
  }
}