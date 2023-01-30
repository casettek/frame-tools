//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

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

  constructor (address _scriptyStorageLib, address _contentStoreFactory) {
    scriptyStorageLibraryAddress = _scriptyStorageLib;
    contentStoreFactoryAddress = _contentStoreFactory;
  }

  function create() public returns (address)  {
    address contentStore = IFactory(contentStoreFactoryAddress).create(); 

    address clone = createClone(scriptyStorageLibraryAddress);
    IScriptyStorage(clone).setContentStore(contentStore);

    emit ScriptyStorageFactoryCreated(clone);
    return clone;
  }

  function createWithNewScript(string calldata name, bytes calldata chunk) public returns (address)  {
    address contentStore = IFactory(contentStoreFactoryAddress).create(); 

    address clone = createClone(scriptyStorageLibraryAddress);
    IScriptyStorage(clone).setContentStore(contentStore);
    IScriptyStorage(clone).createScript(name, bytes(''));
    IScriptyStorage(clone).addChunkToScript(name, chunk);
    
    emit ScriptyStorageFactoryCreated(clone);
    return clone;
  }
}
