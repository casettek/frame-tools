//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

contract FrameFactory is CloneFactory {
  address public immutable libraryAddress;

  event FrameCreated(address newAddress);

  constructor (address _libraryAddress) {
    libraryAddress = _libraryAddress;
  }

  function create() public returns (address)  {
    address clone = createClone(libraryAddress);
    emit FrameCreated(clone);
    return clone;
  }
}
