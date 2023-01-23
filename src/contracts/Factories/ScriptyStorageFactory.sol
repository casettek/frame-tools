//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

interface IScriptyStorageFactory {
  function setName(string memory _name) external;
  function setVersion(string memory _version) external;
}

contract ScriptyStorageFactory is CloneFactory {
  address public libraryAddress;

  event ScriptyStorageFactoryCreated(address newAddress);

  constructor() {}

  function setLibraryAddress(address _libraryAddress) public  {
    require(libraryAddress == address(0), "ScriptyStorageFactory: Library already set");
    libraryAddress = _libraryAddress;
  }

  function createScriptyStorage(address _contentStorage) public returns (address)  {
    address clone = createClone(libraryAddress);

    emit ScriptyStorageFactoryCreated(clone);
    return clone;
  }
}
