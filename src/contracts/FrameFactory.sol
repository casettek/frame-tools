//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

contract FrameFactory is CloneFactory {
  address public libraryAddress;

  event FrameFactoryCreated(address newAddress);

  function setLibraryAddress(address _libraryAddress) public  {
    require(libraryAddress == address(0), "ScriptyFrameFactory: Library already set");
    libraryAddress = _libraryAddress;
  }

  function create() public returns (address)  {
    address clone = createClone(libraryAddress);
    emit FrameFactoryCreated(clone);
    return clone;
  }
}
