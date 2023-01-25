//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

contract ContentStoreFactory is CloneFactory {
  address public immutable libraryAddress;

  event ContentStoreFactoryCreated(address newAddress);

  constructor (address _libraryAddress) {
    libraryAddress = _libraryAddress;
  }

  function create() public returns (address)  {
    address clone = createClone(libraryAddress);
    emit ContentStoreFactoryCreated(clone);
    return clone;
  }
}
