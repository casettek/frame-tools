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

struct FrameMetadata {
    string name;    
    string description;
    string symbol;
}

interface IFactory {
    function create() external returns (address);
}

interface IScriptyStorageFactory {
    function create() external returns (address);
    function createWithNewScript(string calldata name, bytes calldata chunk) external returns (address);
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
    FrameMetadata calldata _metadata,
		uint256 _bufferSize,
    WrappedScriptRequest[] calldata _requests
	) public returns (address)  {
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Apply frame references and scripts
    frame.init(_metadata, address(scriptyBuilder), _bufferSize, _requests);
		frame.mintForOwner(msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }

  function createFrameWithScript(
    FrameMetadata calldata _metadata,
    bytes calldata _script,
    EmptyWrappedScriptRequest calldata _scriptRequest,
    WrappedScriptRequest[] calldata _requests,
    uint256 _requestsBufferSize
	) public returns (address)  {
    IScriptyStorage scriptyStorage = IScriptyStorage(IScriptyStorageFactory(scriptyStorageFactory).createWithNewScript(_scriptRequest.name, _script));
    
    IFrame frame = IFrame(IFactory(frameFactory).create());
    uint totalRequestsCount = _requests.length + 1;
    WrappedScriptRequest[] memory requests = new WrappedScriptRequest[](totalRequestsCount);

    for (uint i = 0; i < _requests.length; i++) {
      requests[i] = _requests[i];
    }

    requests[requests.length - 1] = WrappedScriptRequest({
     	name: _scriptRequest.name,
     	contractAddress: address(scriptyStorage),
			contractData: _scriptRequest.contractData,
			wrapType: _scriptRequest.wrapType,
			wrapPrefix: _scriptRequest.wrapPrefix,
			wrapSuffix: _scriptRequest.wrapSuffix,
			scriptContent: _scriptRequest.scriptContent
		});

    // Apply frame references and scripts
		frame.init(_metadata, address(scriptyBuilder), _requestsBufferSize, requests);
		frame.mintForOwner(msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
