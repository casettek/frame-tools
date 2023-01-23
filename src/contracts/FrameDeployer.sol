//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IFactory {
  function create() external returns (address);
}

interface IContentStore {}

interface IScriptyStorage {}

interface IFrame {}

contract FrameDeployer {
  address public contentStoreFactory;
  address public scriptyStorageFactory;
  address public frameFactory;

  event FrameCreated(address newAddress);

  constructor(address _contentStore, address _scriptyStorage, address _frame) {
    contentStoreFactory = _contentStore;
    scriptyStorageFactory = _scriptyStorage;
    frameFactory = _frame;
  }

  function createFrame() public returns (address)  {
    IContentStore contentStore = IContentStore(IFactory(contentStoreFactory).create());

    // Add content 

    IScriptyStorage scriptyStorage = IScriptyStorage(IFactory(scriptyStorageFactory).create());
    
    // Add content store to scripty storage
    
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Apply frame references and scripts

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
