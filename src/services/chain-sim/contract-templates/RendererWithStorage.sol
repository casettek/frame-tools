//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

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

    /**
     * Storage & Revocation
     **/
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

    // _upToPage = 0 goes to the last page
    function getData(
        string memory _key,
        uint256 _startPage,
        uint256 _endPage
    ) public view returns (bytes memory) {
        // Get the total size
        uint256 totalSize = _endPage > 0
            ? getSizeBetweenPages(_key, _startPage, _endPage)
            : getSizeOfPages(_key);

        // Create a region large enough for all of the data
        bytes memory _totalData = new bytes(totalSize);

        // Retrieve the pages
        ContractDataPages storage _cdPages = _contractDataPages[_key];

        uint256 endPageNumber = _endPage > 0
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
        string[2] wrapper;
        uint256 maxPageNumber;
    }

    AssetStorage public coreDepStorage;

    // string[2] public renderWrapper = [
    //     '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head><body>',
    //     "<div></div></body></html>"
    // ];
    string[2] public renderWrapper;
    
    mapping(uint256 => Asset) public depsList;
    mapping(uint256 => Asset) public assetList;

    uint256 public renderPagesCount;
    mapping(uint256 => uint256[4]) public renderIndex;

    constructor(AssetStorage _coreDepStorage, uint256[4][] memory _renderIndex) {
        setCoreDepStorage(_coreDepStorage);
        setDepsAndAssets();
        setRenderIndex(_renderIndex);
    }

    function setDepsAndAssets() public {
        // TO-DO: Put these in dep storage
        // string[2] memory rawJSWrapper = ["<script>", "</script>"];

        // string[2] memory b64JSEvalWrapper = [
        //     "<script>eval(atob('",
        //     "'));</script>"
        // ];
        // string[2] memory hexAssetWrapper = [
        //     "<script>window._assets = (window._assets||[]).concat(window.fflate.strFromU8(window.fflate.decompressSync(window.hexStringToArrayBuffer('",
        //     "'))));</script>"
        // ];

        renderWrapper = [string(coreDepStorage.getData("renderWrapper1", 0, 0)), string(coreDepStorage.getData("renderWrapper2", 0, 0))];
        string[2] memory rawJSWrapper = [string(coreDepStorage.getData("rawJSWrapper1", 0, 0)), string(coreDepStorage.getData("rawJSWrapper2", 0, 0))];
        string[2] memory b64JSEvalWrapper = [string(coreDepStorage.getData("b64JSEvalWrapper1", 0, 0)), string(coreDepStorage.getData("b64JSEvalWrapper2", 0, 0))];
        string[2] memory hexAssetWrapper = [string(coreDepStorage.getData("hexAssetWrapper1", 0, 0)), string(coreDepStorage.getData("hexAssetWrapper2", 0, 0))];

        depsList[0] = Asset(
            "b64jseval",
            "compressorGlobalB64",
            b64JSEvalWrapper,
            coreDepStorage.getMaxPageNumber("compressorGlobalB64")
        );
        depsList[1] = Asset(
            "gzhexjs",
            "p5gzhex",
            hexAssetWrapper,
            coreDepStorage.getMaxPageNumber("p5gzhex")
        );
        depsList[2] = Asset(
            "rawjs",
            "p5setup",
            rawJSWrapper,
            coreDepStorage.getMaxPageNumber("p5setup")
        );

        assetList[3] = Asset(
            "rawjs",
            "draw",
            rawJSWrapper,
            this.getMaxPageNumber("draw")
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
            Asset memory idxAsset = assetList[idx];
            uint256 startPage = idx == startAtAsset ? startAtPage : 0;
            uint256 endPage = idx == endAtAsset
                ? endAtPage
                : idxAsset.maxPageNumber;

            // If starting at zero, include first part of an asset's wrapper
            if (startPage == 0) {
                result = string.concat(result, idxAsset.wrapper[0]);
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
                endAtPage != idxAsset.maxPageNumber;
            if (!endingEarly) {
                result = string.concat(result, idxAsset.wrapper[1]);
            }
        }

        if (_rpage == 0) {
            return string.concat(renderWrapper[0], result);
        } else if (_rpage == renderPagesCount) {
            return string.concat(result, renderWrapper[1]);
        }

        return result;
    }
}
