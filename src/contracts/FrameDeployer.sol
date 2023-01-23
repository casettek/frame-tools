//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {WrappedScriptRequest} from "./libs/scripty/IScriptyBuilder.sol";

interface IFactory {
  function create() external returns (address);
}

interface IContentStore {}

interface IScriptyStorage {}

interface IFrame {
  	function setParams(
		address _scriptyStorageAddress, 
		address _scriptyBuilderAddress, 
		uint256 _bufferSize, 
		WrappedScriptRequest[] memory _requests
	) external;
}

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
    IScriptyStorage scriptyStorage = IScriptyStorage(IFactory(scriptyStorageFactory).create());
    
    // Add content store to scripty storage
	// scriptyStorage.setContentStore();
	// scriptyStorage.addScript();
	// scriptyStorage.addChunkToScript();
    
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Apply frame references and scripts
	// frame.setName();
	// frame.setSymbol();
	// frame.setParams();
	// frame.mint();

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
