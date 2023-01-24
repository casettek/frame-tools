//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {WrappedScriptRequest} from "./libs/scripty/IScriptyBuilder.sol";

interface IFactory {
  function create() external returns (address);
}

interface IScriptyStorage {
	function setContentStore(address _contentStoreAddress) external;
	function createScript(string calldata name, bytes calldata) external;
	function addChunkToScript(string calldata name, bytes calldata chunk) external;
}

interface IFrame {
	function mintIdForOwner(uint _id, address _owner) external;
	function setName(string calldata _name) external;
	function setSymbol(string calldata _symbol) external;
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
  address public scriptyBuilder;

  event FrameCreated(address newAddress);

  constructor(address _contentStore, address _scriptyStorage, address _frame, address _scriptyBuilder) {
    contentStoreFactory = _contentStore;
    scriptyStorageFactory = _scriptyStorage;
    frameFactory = _frame;
	scriptyBuilder = _scriptyBuilder;
  }

  function createFrame(
		string memory _name,
		string memory _symbol,
		bytes memory _source, 
		uint256 _bufferSize,
    	WrappedScriptRequest[] memory _requests
	) public returns (address)  {

    address contentStore = IFactory(contentStoreFactory).create();
    IScriptyStorage scriptyStorage = IScriptyStorage(IFactory(scriptyStorageFactory).create());
    
    // Add content store to scripty storage
	scriptyStorage.setContentStore(contentStore);
	scriptyStorage.createScript("source", "");
	scriptyStorage.addChunkToScript("source", _source);
    
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Apply frame references and scripts
	frame.setParams(address(scriptyStorage), scriptyBuilder, _bufferSize, _requests);
	frame.setName(_name);
	frame.setSymbol(_symbol);
	frame.mintIdForOwner(0, msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
