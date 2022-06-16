contract Renderer {
    struct Asset {
        string assetType;
        string key;
        string[2] wrapper;
        uint256 maxPageNumber;
    }
    
    string[2] public renderWrapper = {{=it.renderWrapper}};

    mapping(uint256 => Asset) public assetList;
    uint256 public renderPagesCount;
    mapping(uint256 => uint256[4]) public renderIndex;

    constructor() {}
}