pragma solidity ^0.8.12;

contract CloneFactory {
  function createClone(address target) internal returns (address result) {
    bytes20 targetBytes = bytes20(target);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(clone, 0x14), targetBytes)
      mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      result := create(0, clone, 0x37)
    }
  }

  function isClone(address target, address query) internal view returns (bool result) {
    bytes20 targetBytes = bytes20(target);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x363d3d373d3d3d363d7300000000000000000000000000000000000000000000)
      mstore(add(clone, 0xa), targetBytes)
      mstore(add(clone, 0x1e), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

      let other := add(clone, 0x40)
      extcodecopy(query, other, 0, 0x2d)
      result := and(
        eq(mload(clone), mload(other)),
        eq(mload(add(clone, 0xd)), mload(add(other, 0xd)))
      )
    }
  }
}

contract AssetStorage {
    struct ContractData {
        address rawContract;
        uint128 size;
        uint128 offset;
    }

    struct ContractDataPages {
        uint256 maxPageNumber;
        bool exists;
        mapping(uint256 => ContractData) pages;
    }

    mapping(string => ContractDataPages) internal _contractDataPages;

    mapping(address => bool) internal _controllers;

    constructor() {}

    function saveData(
        string memory _key,
        uint128 _pageNumber,
        bytes memory _b
    ) public {
        require(
            _b.length < 24576,
            "Storage: Exceeded 24,576 bytes max contract size"
        );

        // Create the header for the contract data
        bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";
        bytes1 size1 = bytes1(uint8(_b.length));
        bytes1 size2 = bytes1(uint8(_b.length >> 8));
        init[2] = size1;
        init[1] = size2;
        init[10] = size1;
        init[9] = size2;

        // Prepare the code for storage in a contract
        bytes memory code = abi.encodePacked(init, _b);

        // Create the contract
        address dataContract;
        assembly {
            dataContract := create(0, add(code, 32), mload(code))
            if eq(dataContract, 0) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }

        // Store the record of the contract
        saveDataForDeployedContract(
            _key,
            _pageNumber,
            dataContract,
            uint128(_b.length),
            0
        );
    }

    function saveDataForDeployedContract(
        string memory _key,
        uint256 _pageNumber,
        address dataContract,
        uint128 _size,
        uint128 _offset
    ) public {
        // Pull the current data for the contractData
        ContractDataPages storage _cdPages = _contractDataPages[_key];

        // Store the maximum page
        if (_cdPages.maxPageNumber < _pageNumber) {
            _cdPages.maxPageNumber = _pageNumber;
        }

        // Keep track of the existance of this key
        _cdPages.exists = true;

        // Add the page to the location needed
        _cdPages.pages[_pageNumber] = ContractData(
            dataContract,
            _size,
            _offset
        );
    }

    function getSizeOfPages(string memory _key) public view returns (uint256) {
        // For all data within the contract data pages, iterate over and compile them
        ContractDataPages storage _cdPages = _contractDataPages[_key];

        // Determine the total size
        uint256 totalSize;
        for (uint256 idx; idx <= _cdPages.maxPageNumber; idx++) {
            totalSize += _cdPages.pages[idx].size;
        }

        return totalSize;
    }

    function getSizeUpToPage(string memory _key, uint256 _endPage)
        public
        view
        returns (uint256)
    {
        // For all data within the contract data pages, iterate over and compile them
        ContractDataPages storage _cdPages = _contractDataPages[_key];

        // Determine the total size
        uint256 totalSize;
        for (uint256 idx; idx <= _endPage; idx++) {
            totalSize += _cdPages.pages[idx].size;
        }

        return totalSize;
    }

    function getSizeBetweenPages(
        string memory _key,
        uint256 _startPage,
        uint256 _endPage
    ) public view returns (uint256) {
        // For all data within the contract data pages, iterate over and compile them
        ContractDataPages storage _cdPages = _contractDataPages[_key];

        // Determine the total size
        uint256 totalSize;
        for (uint256 idx = _startPage; idx <= _endPage; idx++) {
            totalSize += _cdPages.pages[idx].size;
        }

        return totalSize;
    }

    function getMaxPageNumber(string memory _key)
        public
        view
        returns (uint256)
    {
        return _contractDataPages[_key].maxPageNumber;
    }

    // _endPage < 0 goes to the last page
    function getData(
        string memory _key,
        uint256 _startPage,
        uint256 _endPage
    ) public view returns (bytes memory) {
        bool endPageNeg = _endPage < 0;

        // Get the total size
        uint256 totalSize = endPageNeg
            ? getSizeBetweenPages(_key, _startPage, _endPage)
            : getSizeOfPages(_key);

        // Create a region large enough for all of the data
        bytes memory _totalData = new bytes(totalSize);

        // Retrieve the pages
        ContractDataPages storage _cdPages = _contractDataPages[_key];

        uint256 endPageNumber = endPageNeg
            ? _endPage
            : _cdPages.maxPageNumber;

        // For each page, pull and compile
        uint256 currentPointer = 32;
        for (uint256 idx = _startPage; idx <= endPageNumber; idx++) {
            ContractData storage dataPage = _cdPages.pages[idx];
            address dataContract = dataPage.rawContract;
            uint256 size = uint256(dataPage.size);
            uint256 offset = uint256(dataPage.offset);

            // Copy directly to total data
            assembly {
                extcodecopy(
                    dataContract,
                    add(_totalData, currentPointer),
                    offset,
                    size
                )
            }

            // Update the current pointer
            currentPointer += size;
        }

        return _totalData;
    }
}

contract Renderer is AssetStorage {
    struct Asset {
        string assetType;
        string key;
    }

    AssetStorage public coreDepStorage;
    
    mapping(uint256 => Asset) public depsList;
    uint256 public depsCount;

    mapping(uint256 => Asset) public assetList;

    uint256 public renderPagesCount;
    mapping(uint256 => uint256[4]) public renderIndex;

    // constructor(AssetStorage _coreDepStorage, uint256[4][] memory _renderIndex) {
    //     setCoreDepStorage(_coreDepStorage);
    //     setDepsAndAssets();
    //     setRenderIndex(_renderIndex);
    // }

    constructor() {}

    function init() public {}

    function setDepsAndAssets() public {
        // TO-DO: Move to params?
        depsList[0] = Asset(
            "b64jseval",
            "compressorGlobalB64"
        );
        depsList[1] = Asset(
            "gzhexjs",
            "p5gzhex"
        );
        depsList[2] = Asset(
            "rawjs",
            "p5setup"
        );

        depsCount = 3;

        assetList[0] = Asset(
            "rawjs",
            "draw"
        );
    }

    function setCoreDepStorage(AssetStorage _storage) public {
        coreDepStorage = _storage;
    }

    function setRenderIndex(uint256[4][] memory _index) public {
        for (uint256 idx; idx < _index.length; idx++) {
            renderPagesCount++;
            renderIndex[idx] = _index[idx];
        }
        renderPagesCount = _index.length;
    }

    function renderPage(uint256 _rpage) public view returns (string memory) {
        // [startAsset, endAsset, startAssetPage, endAssetPage]
        uint256[4] memory indexItem = renderIndex[_rpage];
        uint256 startAtAsset = indexItem[0];
        uint256 endAtAsset = indexItem[1];
        uint256 startAtPage = indexItem[2];
        uint256 endAtPage = indexItem[3];
        string memory result = "";

        // TO-DO: Iterate over both depList and assetList
        for (uint256 idx = startAtAsset; idx < endAtAsset + 1; idx++) {
            bool idxIsDep = idx + 1 <= depsCount;
            AssetStorage idxStorage = idxIsDep ? coreDepStorage : this;
            Asset memory idxAsset = idxIsDep ? depsList[idx] : assetList[idx];

            uint256 startPage = idx == startAtAsset ? startAtPage : 0;
            uint256 endPage = idx == endAtAsset
                ? endAtPage
                : idxStorage.getMaxPageNumber(idxAsset.key);

            // If starting at zero, include first part of an asset's wrapper
            if (startPage == 0) {
                result = string.concat(result, string(coreDepStorage.getData(string.concat(idxAsset.assetType, "Wrapper"), 0, 0)));
            }

            result = string.concat(
                result,
                string(
                    abi.encodePacked(
                        coreDepStorage.getData(idxAsset.key, startPage, endPage)
                    )
                )
            );

            // If needed, include last part of an asset's wrapper
            bool endingEarly = idx == endAtAsset &&
                endAtPage != idxStorage.getMaxPageNumber(idxAsset.key);
            if (!endingEarly) {
                result = string.concat(result, string(coreDepStorage.getData(string.concat(idxAsset.assetType, "Wrapper"), 1, 1)));
            }
        }

        if (_rpage == 0) {
            return string.concat(string(coreDepStorage.getData("renderWrapper", 0, 0)), result);
        } else if (_rpage == renderPagesCount) {
            return string.concat(result, string(coreDepStorage.getData("renderWrapper", 1, 1)));
        }

        return result;
    }
}

contract RendererFactory is CloneFactory {
  address public libraryAddress;

  event RendererCreated(address newAddress);

  constructor(address _libraryAddress) {
    libraryAddress = _libraryAddress;
  }

  function createRenderer(string calldata _name, uint _value) public  {
    address clone = createClone(libraryAddress);
    Renderer(clone).init();
    emit RendererCreated(clone);
  }
}