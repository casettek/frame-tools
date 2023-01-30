//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
  @title A factory for creating new ScriptyStorage contracts.
  @author @caszete

  Special thanks to @0xthedude, @xtremetom, @frolic and @cxkoda
*/

import "./CloneFactory.sol";

interface IFactory {
    function create() external returns (address);
}

interface IScriptyStorage {
	function setContentStore(address _contentStoreAddress) external;
  function createScript(string calldata name, bytes calldata) external;
	function addChunkToScript(string calldata name, bytes calldata chunk) external;
}

contract ScriptyStorageFactory is CloneFactory {
  address public immutable scriptyStorageLibraryAddress;
  address public immutable contentStoreFactoryAddress;

  event ScriptyStorageFactoryCreated(address newAddress);

  /**
    * @notice Create the contract with required references.
    * @param _scriptyStorageLib - ScriptyStorage contract to clone.
    * @param _contentStoreFactory - ETHFS ContentStore contract to clone.
    * Required for ScriptyStorage.
    */
  constructor (address _scriptyStorageLib, address _contentStoreFactory) {
    scriptyStorageLibraryAddress = _scriptyStorageLib;
    contentStoreFactoryAddress = _contentStoreFactory;
  }

  /**
    * @notice Create an empty ScriptyStorage clone.
    * @return The address of the new ScriptyStorage contract.
    */
  function create() public returns (address)  {
    // Create new ScriptyStorage and apply reference to ContentStore.
    address contentStore = IFactory(contentStoreFactoryAddress).create(); 
    address clone = createClone(scriptyStorageLibraryAddress);
    IScriptyStorage(clone).setContentStore(contentStore);

    emit ScriptyStorageFactoryCreated(clone);
    return clone;
  }

  /**
    * @notice Create a ScriptyStorage clone with a new script.
    * @param _name - The name of the script.
    * @param _chunk - The first chunk of the script.
    * @return The address of the new ScriptyStorage contract.
    */
  function createWithNewScript(string calldata _name, bytes calldata _chunk) public returns (address)  {
    // Create new ScriptyStorage and apply reference to ContentStore.
    address contentStore = IFactory(contentStoreFactoryAddress).create(); 
    address clone = createClone(scriptyStorageLibraryAddress);
    IScriptyStorage(clone).setContentStore(contentStore);

    // Create and store the new script.
    IScriptyStorage(clone).createScript(_name, bytes(''));
    IScriptyStorage(clone).addChunkToScript(_name, _chunk);
    
    emit ScriptyStorageFactoryCreated(clone);
    return clone;
  }
}
