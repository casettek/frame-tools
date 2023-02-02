//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
/**
  @title An contract for deploying scripty-based HTML NFTs.
  @author @caszete

  Special thanks to @0xthedude, @xtremetom, @frolic and @cxkoda
*/
import {WrappedScriptRequest} from "./libs/scripty/IScriptyBuilder.sol";

struct FrameMetadata {
    string name;    
    string description;
    string symbol;
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
  address public immutable frameFactory;
  address public immutable scriptyBuilder;

  event FrameCreated(address newAddress);

  /**
     * @notice Create the contract with required references.
     * @param _frameFactory - Contract that creates Frame clones.
     * @param _scriptyBuilder - Contract that assembles HTML from script requests.
     */
  constructor(address _frameFactory, address _scriptyBuilder) {
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
     * @notice Create a new Frame NFT contract and save a new script to ScriptyStorage.
     * @param _metadata - Contract metadata.
     * @param _script - A single chunk of script data.
     * @param _requests - ScriptyBuilder requests for all HTML script elements.
     * @param _requestsBufferSize - Total buffer size of all requested scripts, inlcuding 
     * the new to-be-stored _script.
     * @return Address for the newly created Frame NFT contract.
     */
  function createFrameWithScript(
    FrameMetadata calldata _metadata,
    bytes calldata _script,
    WrappedScriptRequest[] calldata _requests,
    uint256 _requestsBufferSize
	) public returns (address)  {
    // Get the last request, which is the source of the new script
    WrappedScriptRequest memory sourceScriptRequest = _requests[_requests.length - 1];

    // Save new script data
    string memory sourceScriptName = sourceScriptRequest.name;
    IScriptyStorage sourceScriptStorage = IScriptyStorage(sourceScriptRequest.contractAddress);

    // Create a new ScriptyStorage contract and save new script data
    sourceScriptStorage.createScript(sourceScriptName, bytes(''));
    sourceScriptStorage.addChunkToScript(sourceScriptName, _script);
    
    // Create a new Frame contract
    IFrame frame = IFrame(IFactory(frameFactory).create());

    // Apply ScriptyBuilder references and requests
		frame.init(_metadata, address(scriptyBuilder), _requestsBufferSize, _requests);
		frame.mintForOwner(msg.sender);

    emit FrameCreated(address(frame));
    return address(frame);
  }
}
