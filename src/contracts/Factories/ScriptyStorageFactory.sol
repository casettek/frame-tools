//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

contract ScriptyStorageFactory is CloneFactory {
  address public libraryAddress;

  event ScriptyStorageFactoryCreated(address newAddress);

  function setLibraryAddress(address _libraryAddress) public  {
    require(libraryAddress == address(0), "ScriptyStorageFactory: Library already set");
    libraryAddress = _libraryAddress;
  }

  function create() public returns (address)  {
    address clone = createClone(libraryAddress);
    emit ScriptyStorageFactoryCreated(clone);
    return clone;
  }
}
