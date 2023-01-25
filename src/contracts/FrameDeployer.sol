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
		address _scriptyBuilderAddress, 
		uint256 _bufferSize, 
		WrappedScriptRequest[] memory _requests
	) external;
}

contract FrameDeployer {
  address public scriptyStorageFactory;
  address public frameFactory;
  address public scriptyBuilder;

  event FrameCreated(address newAddress);

  constructor(address _scriptyStorage, address _frame, address _scriptyBuilder) {
    scriptyStorageFactory = _scriptyStorage;
    frameFactory = _frame;
		scriptyBuilder = _scriptyBuilder;
  }

  function createFrame(
		string memory _name,
		string memory _symbol,
		uint256 _bufferSize,
    WrappedScriptRequest[] memory _requests
	) public returns (address)  {

    // address contentStore = IFactory(contentStoreFactory).create();
    // IScriptyStorage scriptyStorage = IScriptyStorage(IFactory(scriptyStorageFactory).create());
    
    // // Add content store to scripty storage
		// scriptyStorage.setContentStore(contentStore);
		// scriptyStorage.createScript("source", bytes(""));
		// scriptyStorage.addChunkToScript("source", _source);
    
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // WrappedScriptRequest[] memory requests = new WrappedScriptRequest[](1);
    // requests[0] = WrappedScriptRequest({
    //  	name: "source",
    //  	contractAddress: address(scriptyStorage),
		// 	contractData: bytes(""),
		// 	wrapType: 0,
		// 	wrapPrefix: bytes(""),
		// 	wrapSuffix: bytes(""),
		// 	scriptContent: bytes("")
		// });

    // Apply frame references and scripts
		frame.setParams(address(scriptyBuilder), _bufferSize, _requests);
		frame.setName(_name);
		frame.setSymbol(_symbol);
		frame.mintIdForOwner(0, msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
