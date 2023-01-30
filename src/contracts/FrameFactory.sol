//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
  @title A factory for creating new Frame contracts.
  @author @caszete
*/

import "./CloneFactory.sol";

contract FrameFactory is CloneFactory {
  address public immutable libraryAddress;

  event FrameCreated(address newAddress);

  /**
    * @notice Create the contract with required references.
    * @param _libraryAddress - Frame contract to clone.
    */
  constructor (address _libraryAddress) {
    libraryAddress = _libraryAddress;
  }

  /**
    * @notice Create an un-initialized, un-minted Frame clone.
    * @return The address of the new Frame contract.
    */
  function create() public returns (address)  {
    address clone = createClone(libraryAddress);
    emit FrameCreated(clone);
    return clone;
  }
}
