//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

interface IScriptyFrame {
  function setName(string memory _name) external;
  function setVersion(string memory _version) external;
}

interface IScriptyStorageFactory {
    function createScriptyStorageFactory(string memory _name, string memory _version) external returns (address);
}

contract ScriptyFrameFactory is CloneFactory {
  address public libraryAddress;

  event ScriptyFrameFactoryCreated(address newAddress);

  constructor() {}

  function setLibraryAddress(address _libraryAddress) public  {
    require(libraryAddress == address(0), "ScriptyFrameFactory: Library already set");
    libraryAddress = _libraryAddress;
  }

  function createClone() public returns (address)  {
    address clone = createClone(libraryAddress);

    emit ScriptyFrameFactoryCreated(clone);
    return clone;
  }
}
