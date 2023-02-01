import { importIds, importData } from "./assets/libs";
import { ImportDataMap } from "./types/types";
import {
  calcStoragePages,
  storeChunks,
  getLibDataLogs,
  toBytes,
  fromBytes,
} from "./utils/web3";

const hre = require("hardhat");
const fs = require("fs");

const { p5gz, gunzip } = importIds;
const libs: ImportDataMap = {
  [gunzip]: {
    data: importData[gunzip],
    wrapper: "",
    pages: calcStoragePages(importData[gunzip]),
  },
  [p5gz]: {
    data: importData[p5gz],
    wrapper: "gzip",
    pages: calcStoragePages(importData[p5gz]),
  },
};

const createWrappedRequest = (
  name: string,
  contentStore: string,
  wrapType: number
) => ({
  name,
  contractAddress: contentStore,
  contractData: toBytes(""),
  wrapType,
  wrapPrefix: toBytes(""),
  wrapSuffix: toBytes(""),
  scriptContent: toBytes(""),
});

const createEmptyWrappedRequest = (name: string, wrapType: number) => ({
  name,
  contractData: toBytes(""),
  wrapType,
  wrapPrefix: toBytes(""),
  wrapSuffix: toBytes(""),
  scriptContent: toBytes(""),
});

const getBufferSize = (data: string) => {
  const RAW_JS_WRAPPER = [
    "%253Cscript%2520src%253D%2522data%253Atext%252Fjavascript%253Bbase64%252C",
    "%2522%253E%253C%252Fscript%253E",
  ];

  let bufferSizeLocal = 0;
  bufferSizeLocal += Buffer.byteLength(RAW_JS_WRAPPER[0] + RAW_JS_WRAPPER[1]);
  bufferSizeLocal += Buffer.byteLength(data);

  return bufferSizeLocal;
};

const deployNewScriptyStorage = async (factory: string) => {
  console.log(factory);
  const ScriptyStorageCloneable = await hre.ethers.getContractFactory(
    "ScriptyStorageCloneable"
  );
  const ScriptyStorageFactory = await hre.ethers.getContractFactory(
    "ScriptyStorageFactory"
  );
  const scriptyStorageFactory = await ScriptyStorageFactory.attach(factory);
  const createStorageCall = await scriptyStorageFactory.create();
  const createStorageResult = await createStorageCall.wait();
  const newStorageAddress = createStorageResult.logs[1]?.data.replace(
    "000000000000000000000000",
    ""
  );
  return await ScriptyStorageCloneable.attach(newStorageAddress);
};

const deployBaseContracts = async (network: string) => {
  console.log("Deploying base contracts...");

  let output: any = {};

  // Deploy libs and factories
  const scriptyBuilder = await (
    await hre.ethers.getContractFactory("ScriptyBuilder")
  ).deploy();
  await scriptyBuilder.deployed();
  output.ScriptyBuilder = scriptyBuilder.address;
  console.log("ScriptyBuilder deployed", scriptyBuilder.address);

  const frameLib = await (
    await hre.ethers.getContractFactory("Frame")
  ).deploy();
  await frameLib.deployed();
  output.Frame = frameLib.address;
  console.log("Frame deployed", frameLib.address);

  const frameFactory = await (
    await hre.ethers.getContractFactory("FrameFactory")
  ).deploy(frameLib.address);
  await frameFactory.deployed();
  output.FrameFactory = frameFactory.address;
  console.log("FrameFactory deployed", frameFactory.address);

  const contentStoreLib = await (
    await hre.ethers.getContractFactory("ContentStore")
  ).deploy();
  await contentStoreLib.deployed();
  output.ContentStore = contentStoreLib.address;
  console.log("ContentStoreLib deployed", contentStoreLib.address);

  const contentStoreFactory = await (
    await hre.ethers.getContractFactory("ContentStoreFactory")
  ).deploy(contentStoreLib.address);
  await contentStoreFactory.deployed();
  output.ContentStoreFactory = contentStoreFactory.address;
  console.log("ContentStoreFactory deployed", contentStoreFactory.address);

  const scriptyStorageLib = await (
    await hre.ethers.getContractFactory("ScriptyStorageCloneable")
  ).deploy();
  await scriptyStorageLib.deployed();
  output.ScriptyStorage = scriptyStorageLib.address;
  console.log("ScriptyStorage deployed", scriptyStorageLib.address);

  const scriptyStorageFactory = await (
    await hre.ethers.getContractFactory("ScriptyStorageFactory")
  ).deploy(scriptyStorageLib.address, contentStoreFactory.address);
  await scriptyStorageFactory.deployed();
  output.ScriptyStorageFactory = scriptyStorageFactory.address;
  console.log("ScriptyStorageFactory deployed", scriptyStorageFactory.address);

  const frameDeployer = await (
    await hre.ethers.getContractFactory("FrameDeployer")
  ).deploy(
    scriptyStorageFactory.address,
    frameFactory.address,
    scriptyBuilder.address
  );
  await frameDeployer.deployed();
  output.FrameDeployer = frameDeployer.address;
  console.log("FrameDeployer deployed", frameDeployer.address);

  fs.writeFileSync(
    __dirname + "/deployments/" + network + ".json",
    JSON.stringify(output),
    {
      encoding: "utf8",
      flag: "w",
    }
  );
};

const deployLibraries = async (network: string) => {
  const dPath = __dirname + "/deployments/" + network + ".json";
  const deployments = JSON.parse(
    fs.readFileSync(__dirname + "/deployments/" + network + ".json").toString()
  );
  console.log(deployments);
  const storage = await deployNewScriptyStorage(
    deployments.ScriptyStorageFactory
  );
  console.log("New storage", storage.address);

  fs.writeFileSync(
    dPath,
    JSON.stringify({ ...deployments, LibsScriptyStorage: storage.address }),
    {
      encoding: "utf8",
      flag: "w",
    }
  );

  // Deploy libraries
  for (const libId in libs) {
    const lib = libs[libId];

    // Do this manually on other networks from logs
    if (network === "localhost") {
      await storage.createScript(libId, toBytes(""));
      await storeChunks(storage, libId, lib.data, lib.pages);
    }

    fs.writeFileSync(
      __dirname + "/output/" + libId + "-logs",
      JSON.stringify(getLibDataLogs(libId, lib.data, lib.pages)),
      {
        encoding: "utf8",
        flag: "w",
      }
    );
  }
};

export const deployRawHTML = async (
  name: string,
  libNames: string[],
  sourcePath: string,
  network: string
) => {
  console.log('Deploying "TestHTML.html"...');

  const deployments = JSON.parse(
    fs.readFileSync(__dirname + "/deployments/" + network + ".json").toString()
  );

  const libsScriptyStorage = await (
    await hre.ethers.getContractFactory("ScriptyStorageCloneable")
  ).attach(deployments.LibsScriptyStorage);

  const scriptyBuilder = await (
    await hre.ethers.getContractFactory("ScriptyBuilder")
  ).attach(deployments.ScriptyBuilder);

  // Deploy source
  const sourceScriptyStorage = await deployNewScriptyStorage(
    deployments.ScriptyStorageFactory
  );
  const sourceId = name + "-source";
  const sourceContent = Buffer.from(
    fs.readFileSync(__dirname + sourcePath).toString()
  ).toString("base64");
  await sourceScriptyStorage.createScript(sourceId, toBytes(""));
  await storeChunks(sourceScriptyStorage, sourceId, sourceContent, 1);

  // Create requests
  const libRequests = libNames.map((lib) =>
    createWrappedRequest(
      lib,
      libsScriptyStorage.address,
      libs[lib].wrapper === "gzip" ? 2 : 1
    )
  );
  const sourceRequest = createWrappedRequest(
    sourceId,
    sourceScriptyStorage.address,
    1
  );
  const requests = libRequests.concat([sourceRequest]);
  const bufferSize = await scriptyBuilder.getBufferSizeForURLSafeHTMLWrapped(
    requests
  );

  // Test local accuracy
  const libsBufferSize =
    await scriptyBuilder.getBufferSizeForURLSafeHTMLWrapped(libRequests);
  console.log(
    "local buffersize",
    libsBufferSize.toNumber(),
    getBufferSize(sourceContent),
    libsBufferSize.toNumber() + getBufferSize(sourceContent)
  );
  console.log("bufferSize", bufferSize.toString());

  console.log("Fetching HTML from on-chain...");
  const query = await scriptyBuilder.getHTMLWrappedURLSafe(
    requests,
    bufferSize
  );

  const html = decodeURIComponent(decodeURIComponent(fromBytes(query))).replace(
    "data:text/html,",
    ""
  );

  fs.writeFileSync(__dirname + "/output/output.html", html, {
    encoding: "utf8",
    flag: "w",
  });
};

// Deploy single frame across two transactions
export const deployFrameWithScript = async (
  name: string,
  description: string,
  symbol: string,
  libNames: string[],
  sourcePath: string,
  network: "mainnet" | "goerli" | "localhost"
) => {
  console.log('Deploying frame "' + name + '"...');

  const deployments = JSON.parse(
    fs.readFileSync(__dirname + "/deployments/" + network + ".json").toString()
  );

  // Init contracts
  const libsScriptyStorage = await (
    await hre.ethers.getContractFactory("ScriptyStorageCloneable")
  ).attach(deployments.LibsScriptyStorage);

  const scriptyBuilder = await (
    await hre.ethers.getContractFactory("ScriptyBuilder")
  ).attach(deployments.ScriptyBuilder);

  const frameDeployer = await (
    await hre.ethers.getContractFactory("FrameDeployer")
  ).attach(deployments.FrameDeployer);

  // Deploy source
  const sourceId = name + "-source";
  const sourceContent = Buffer.from(
    fs.readFileSync(__dirname + sourcePath).toString()
  ).toString("base64");

  // Create requests
  const libsRequests = libNames.map((lib) =>
    createWrappedRequest(
      lib,
      libsScriptyStorage.address,
      libs[lib].wrapper === "gzip" ? 2 : 1
    )
  );
  const sourceRequest = createEmptyWrappedRequest(sourceId, 1);
  const libsBufferSize =
    await scriptyBuilder.getBufferSizeForURLSafeHTMLWrapped(libsRequests);
  const sourceBufferSize = getBufferSize(sourceContent);
  const bufferSize = libsBufferSize.toNumber() + sourceBufferSize;

  const Frame = await hre.ethers.getContractFactory("Frame");
  const createCall = await frameDeployer.createFrameWithScript(
    {
      name,
      description,
      symbol,
    },
    toBytes(sourceContent),
    sourceRequest,
    libsRequests,
    bufferSize
  );

  const createResult = await createCall.wait();
  const newFrameAddress = createResult.logs[
    createResult.logs.length - 1
  ]?.data.replace("000000000000000000000000", "");

  console.log("Fetching tokenURI from on-chain...");

  const frame = await Frame.attach(newFrameAddress);
  const tokenURI = await frame.tokenURI(0);

  const html = decodeURIComponent(
    decodeURIComponent(
      JSON.parse(tokenURI.replace("data:application/json,", "")).animation_url
    )
  ).replace("data:text/html,", "");

  fs.writeFileSync(__dirname + "/output/output.html", html, {
    encoding: "utf8",
    flag: "w",
  });

  console.log("Frame deployed at", newFrameAddress);
  console.log("Gas used", createResult.gasUsed);
};

export const initLocal = async () => {
  await deployBaseContracts("localhost");
  await deployLibraries("localhost");
};

export const initGoerli = async () => {
  await deployBaseContracts("goerli");
};
