//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

contract ContentStoreFactory is CloneFactory {
  address public libraryAddress;

  event ContentStoreFactoryCreated(address newAddress);

  constructor() {}

  function setLibraryAddress(address _libraryAddress) public  {
    require(libraryAddress == address(0), "ContentStoreFactory: Library already set");
    libraryAddress = _libraryAddress;
  }

  function createContentStore() public returns (address)  {
    address clone = createClone(libraryAddress);

    emit ContentStoreFactoryCreated(clone);
    return clone;
  }
}
