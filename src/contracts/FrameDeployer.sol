//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
/**
  @title An contract for deploying scripty-based HTML NFTs.
  @author @caszete

  Special thanks to @0xthedude, @xtremetom, @frolic and @cxkoda
*/
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

  /**
     * @notice Create the contract with required references.
     * @param _scriptyStorageFactory - Contract that creates ScriptyStorage clones.
     * @param _frameFactory - Contract that creates Frame clones.
     * @param _scriptyBuilder - Contract that assembles HTML from script requests.
     */
  constructor(address _scriptyStorageFactory, address _frameFactory, address _scriptyBuilder) {
    scriptyStorageFactory = _scriptyStorageFactory;
    frameFactory = _frameFactory;
		scriptyBuilder = _scriptyBuilder;
  }

  /**
     * @notice Create a new Frame NFT contract referencing data that already exists 
     * in a ScriptyStorage contract somewhere.
     * @param _metadata - Contract metadata.
     * @param _requests - ScriptyBuilder requests for all HTML script elements.
     * @param _bufferSize - Total buffer size of all requested scripts.
     * @return Address for the newly created Frame NFT contract.
     */
  function createFrame(
    FrameMetadata calldata _metadata,
    WrappedScriptRequest[] calldata _requests,
    uint256 _bufferSize
	) public returns (address)  {
    // Create a new Frame contract
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Apply ScriptyBuilder references and requests
    frame.init(_metadata, address(scriptyBuilder), _bufferSize, _requests);
		frame.mintForOwner(msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }

  /**
     * @notice Create a new Frame NFT contract referencing data that already exists 
     * in a ScriptyStorage contract somewhere.
     * @param _metadata - Contract metadata.
     * @param _script - A single chunk of script data.
     * @param _scriptRequest - A ScriptyBuilder request without a contractAddress.
     * @param _requests - ScriptyBuilder requests for all HTML script elements.
     * @param _requestsBufferSize - Total buffer size of all requested scripts, inlcuding 
     * the new to-be-stored _script.
     * @return Address for the newly created Frame NFT contract.
     */
  function createFrameWithScript(
    FrameMetadata calldata _metadata,
    bytes calldata _script,
    EmptyWrappedScriptRequest calldata _scriptRequest,
    WrappedScriptRequest[] calldata _requests,
    uint256 _requestsBufferSize
	) public returns (address)  {
    // Create a new ScriptyStorage contract and save new script data
    IScriptyStorage scriptyStorage = IScriptyStorage(
      IScriptyStorageFactory(scriptyStorageFactory).createWithNewScript(_scriptRequest.name, _script)
    );
    
    // Create a new Frame contract
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Append a request for the newly stored script to _requests
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

    // Apply ScriptyBuilder references and requests
		frame.init(_metadata, address(scriptyBuilder), _requestsBufferSize, requests);
		frame.mintForOwner(msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
