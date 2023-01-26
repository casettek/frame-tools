//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {WrappedScriptRequest} from "./libs/scripty/IScriptyBuilder.sol";

struct EmptyWrappedScriptRequest {
    string name;
    bytes contractData;
    uint8 wrapType;
    bytes wrapPrefix;
    bytes wrapSuffix;
    bytes scriptContent;
}

struct FrameTokenMetadata {
    string name;
    string symbol;
}

struct FrameMetadata {
    string encodedName;    
    string encodedDescription;
}

interface IFactory {
    function create() external returns (address);
}

interface IScriptyStorage {
	function createScript(string calldata name, bytes calldata) external;
	function addChunkToScript(string calldata name, bytes calldata chunk) external;
}

interface IFrame {
	function mintForOwner(address _owner) external;
	function setName(string calldata _name) external;
	function setSymbol(string calldata _symbol) external;
  function init(
    FrameMetadata calldata _metadata,
		address _scriptyBuilderAddress, 
		uint256 _bufferSize, 
		WrappedScriptRequest[] calldata _requests
	) external;
}

contract FrameDeployer {
  address public immutable scriptyStorageFactory;
  address public immutable frameFactory;
  address public immutable scriptyBuilder;

  event FrameCreated(address newAddress);

  constructor(address _scriptyStorage, address _frame, address _scriptyBuilder) {
    scriptyStorageFactory = _scriptyStorage;
    frameFactory = _frame;
		scriptyBuilder = _scriptyBuilder;
  }

  function createFrame(
    FrameTokenMetadata calldata _tokenMetadata,
    FrameMetadata calldata _metadata,
		uint256 _bufferSize,
    WrappedScriptRequest[] calldata _requests
	) public returns (address)  {
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Apply frame references and scripts
		frame.setName(_tokenMetadata.name);
		frame.setSymbol(_tokenMetadata.symbol);
    frame.init(_metadata, address(scriptyBuilder), _bufferSize, _requests);
		frame.mintForOwner(msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }

  function createFrameWithStorage(
		FrameTokenMetadata calldata _tokenMetadata,
    FrameMetadata calldata _metadata,
		uint256 _bufferSize,
    EmptyWrappedScriptRequest calldata _sourceRequest,
    WrappedScriptRequest[] calldata _requests
	) public returns (address)  {

    IScriptyStorage scriptyStorage = IScriptyStorage(IFactory(scriptyStorageFactory).create());

    // Add content store to scripty storage
    scriptyStorage.createScript(_sourceRequest.name, bytes(""));
    scriptyStorage.addChunkToScript(_sourceRequest.name, _sourceRequest.scriptContent);
    
    IFrame frame = IFrame(IFactory(frameFactory).create());
    uint totalRequestsCount = _requests.length + 1;
    WrappedScriptRequest[] memory requests = new WrappedScriptRequest[](totalRequestsCount);

    for (uint i = 0; i < _requests.length; i++) {
      requests[i] = _requests[i];
    }

    requests[requests.length] = WrappedScriptRequest({
     	name: _sourceRequest.name,
     	contractAddress: address(scriptyStorage),
			contractData: _sourceRequest.contractData,
			wrapType: _sourceRequest.wrapType,
			wrapPrefix: _sourceRequest.wrapPrefix,
			wrapSuffix: _sourceRequest.wrapSuffix,
			scriptContent: _sourceRequest.scriptContent
		});

    // Apply frame references and scripts
		frame.init(_metadata, address(scriptyBuilder), _bufferSize, requests);
		frame.setName(_tokenMetadata.name);
		frame.setSymbol(_tokenMetadata.symbol);
		frame.mintForOwner(msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
