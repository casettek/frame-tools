//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

interface IContentStoreFactory {
  function setName(string memory _name) external;
  function setVersion(string memory _version) external;
}

contract ContentStoreFactory is CloneFactory {
  address public libraryAddress;

  event ContentStoreFactoryCreated(address newAddress);

  constructor() {}

  function setLibraryAddress(address _libraryAddress) public  {
    require(libraryAddress == address(0), "ContentStoreFactory: Library already set");
    libraryAddress = _libraryAddress;
  }

  function createContentStore(string memory _name, string memory _version) public returns (address)  {
    address clone = createClone(libraryAddress);

    IContentStoreFactory(clone).setName(_name);
    IContentStoreFactory(clone).setVersion(_version);

    emit ContentStoreFactoryCreated(clone);
    return clone;
  }
}
