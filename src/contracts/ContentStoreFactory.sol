//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
  @title A factory for creating new ContentStore contracts.
  @author @caszete

  Special thanks to @frolic and @cxkoda
*/

import "./CloneFactory.sol";

contract ContentStoreFactory is CloneFactory {
  address public immutable libraryAddress;

  event ContentStoreFactoryCreated(address newAddress);

  /**
    * @notice Create the contract with required references.
    * @param _libraryAddress - ContentStore contract to clone.
    */
  constructor (address _libraryAddress) {
    libraryAddress = _libraryAddress;
  }

  /**
    * @notice Create an empty ContentStore clone.
    * @return The address of the new ContentStore contract.
    */
  function create() public returns (address)  {
    address clone = createClone(libraryAddress);
    emit ContentStoreFactoryCreated(clone);
    return clone;
  }
}
