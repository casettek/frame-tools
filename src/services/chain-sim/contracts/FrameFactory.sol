//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./CloneFactory.sol";

interface FrameDataStore {
    function saveData(string memory _key, uint128 _pageNumber, bytes memory _b) external;
    function lock() external;
}

interface FrameDataStoreFactory {
    function createFrameDataStore(string memory _name, string memory _version) external returns (address);
}

interface Frame {
    function init(
        address _coreDepStorage,
        address _assetStorage,
        string[2][] calldata _deps,
        string[2][] calldata _assets,
        uint256[4][] calldata _renderIndex
    ) external;

    function setName(string calldata _name) external;
}

contract FrameFactory is CloneFactory {
    address public libraryAddress;

    event FrameCreated(address newAddress);

    constructor() {}

    function setLibraryAddress(address _libraryAddress) public  {
        require(libraryAddress == address(0), "FrameFactory: Library already set");
        libraryAddress = _libraryAddress;
    }

    function createFrameWithSource(
        address _coreDepStorage,
        FrameDataStoreFactory _frameDataStoreFactory,
        string[2][][2] calldata _depsAndAssets,
        bytes[] calldata _assetsData,
        uint256[4][] calldata _renderIndex,
        string calldata _name
    ) public returns (address)  {
        // Create new frame contract and data store contract
        address clone = createClone(libraryAddress);
        address _assetStorage = _frameDataStoreFactory.createFrameDataStore(string.concat(_name, " ", "Source"), "1.0.0");

        // Init frame
        Frame(clone).init(
            _coreDepStorage, 
            _assetStorage, 
            _depsAndAssets[0], 
            _depsAndAssets[1], 
            _renderIndex
        );

        // Set frame name and save source to newly created data store
        Frame(clone).setName(_name);
        for (uint256 adx = 0; adx < _assetsData.length; adx++) {
          FrameDataStore(_assetStorage).saveData(string(_depsAndAssets[1][adx][1]), 0, _assetsData[adx]);
        }
        
        // Lock newly created data store
        FrameDataStore(_assetStorage).lock();

        emit FrameCreated(clone);
        return clone;
    }
}