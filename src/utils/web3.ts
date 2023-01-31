const hre = require("hardhat");
export const toBytes = hre.ethers.utils.toUtf8Bytes;
export const fromBytes = hre.ethers.utils.toUtf8String;
export const hexlify = hre.ethers.utils.hexlify;

export const chunkSubstr = (str: string, size: number) => {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
};

export const staggerStore = async (
  contract: any,
  key: string,
  dataString: string,
  chunks: number
) => {
  if (chunks === 1) {
    await contract.addChunkToScript(key, toBytes(dataString));
    return;
  }

  const stringChunks = chunkSubstr(
    dataString,
    Math.ceil(dataString.length / chunks)
  );

  for (let i = 0; i < stringChunks.length; i++) {
    await contract.addChunkToScript(key, toBytes(stringChunks[i]));
    // await contract.saveData(key, i, toBytes(stringChunks[i]));
    // console.log(`Stored ${key} page ${i}`);
  }
};

export const storeChunks = async (
  contract: any,
  key: string,
  dataString: string,
  chunks: number
) => {
  console.log("Storing " + key);
  if (chunks === 1) {
    await contract.addChunkToScript(key, toBytes(dataString));
    console.log(`Stored ${key} in 1 page`);
    return;
  }

  const stringChunks = chunkSubstr(
    dataString,
    Math.ceil(dataString.length / chunks)
  );

  for (let i = 0; i < stringChunks.length; i++) {
    await contract.addChunkToScript(key, toBytes(stringChunks[i]));
  }
  console.log(`Stored ${key} in ${stringChunks.length} pages`);
};

export const getWrapperDataLogs = (wrapperKey: string, wrapperData: any) => {
  return [
    {
      [wrapperKey + "_0"]: hexlify(toBytes(wrapperData[0])),
      [wrapperKey + "_1"]: hexlify(toBytes(wrapperData[1])),
    },
  ];
};

export const getLibDataLogs = (
  key: string,
  dataString: string,
  chunks: number
) => {
  const stringChunks = chunkSubstr(
    dataString,
    Math.ceil(dataString.length / chunks)
  );

  let result: any = {};
  for (let i = 0; i < stringChunks.length; i++) {
    result[(key + "_" + i) as string] = hexlify(toBytes(stringChunks[i]));
  }
  return result;
};

export const constructRenderIndex = (
  assetPageSizes: number[],
  maxRenderPageSize: number
) => {
  const renderIndex = [];
  let totalAssetPagesCount = 0;
  for (let idx = 0; idx < assetPageSizes.length; idx++) {
    totalAssetPagesCount = totalAssetPagesCount + assetPageSizes[idx];
  }

  const assetPages = assetPageSizes
    .map((a) => {
      const arr = new Array(a);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i;
      }
      return arr;
    })
    .reduce(
      (previousValue, currentValue) => previousValue.concat(currentValue),
      []
    );

  let assetCursor = 0;
  let pageCursor = 0;
  let pagesTraversedCounter = 0;
  let totalPagesTraversedCounter = 0;
  let currentStartAsset = 0;
  let currentStartPage = 0;

  for (let adx = 0; adx < assetPages.length; adx++) {
    pagesTraversedCounter++;
    totalPagesTraversedCounter++;

    // Move to next asset when page value changes
    const value = assetPages[adx];
    const prevValue = assetPages[adx - 1];
    if (value <= prevValue) {
      assetCursor++;
    }

    pageCursor = value;

    // At the start of a new render page, record the new position
    if (pagesTraversedCounter === 1) {
      currentStartAsset = assetCursor;
      currentStartPage = pageCursor;
    }

    // Reached the end of either the render page or all assets
    if (
      pagesTraversedCounter === maxRenderPageSize ||
      totalPagesTraversedCounter === assetPages.length
    ) {
      // Add item
      renderIndex.push([
        currentStartAsset,
        assetCursor,
        currentStartPage,
        pageCursor,
      ]);
      pagesTraversedCounter = 0;
    }
  }

  return renderIndex;
};

export const roughSizeOfObject = (object: any) => {
  var objectList = [];
  var stack = [object];
  var bytes = 0;

  while (stack.length) {
    var value = stack.pop();

    if (typeof value === "boolean") {
      bytes += 4;
    } else if (typeof value === "string") {
      bytes += value.length * 2;
    } else if (typeof value === "number") {
      bytes += 8;
    } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
      objectList.push(value);

      for (var i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
};

export const calcStoragePages = (object: any) => {
  return Math.ceil(roughSizeOfObject(object) / 22000);
};

export default {
  toBytes,
  chunkSubstr,
  staggerStore,
  constructRenderIndex,
  roughSizeOfObject,
  calcStoragePages,
};
