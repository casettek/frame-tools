import { importIds, importData } from "./assets/libs";
import { ImportDataMap } from "./types/types";
import {
  calcStoragePages,
  storeChunks,
  toBytes,
  fromBytes,
} from "./utils/web3";

const hre = require("hardhat");
const fs = require("fs");

// Base
let scriptyBuilder: any;
let frameLib: any;
let frameFactory: any;
let contentStoreLib: any;
let contentStoreFactory: any;
let scriptyStorageLib: any;
let scriptyStorageFactory: any;
let frameDeployer: any;

// Instance
let libsScriptyStorage: any;

const { p5, fflate, p5gz, gunzip } = importIds;
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
  [p5]: {
    data: importData[p5],
    wrapper: "",
    pages: calcStoragePages(importData[p5]),
  },
  [fflate]: {
    data: importData[fflate],
    wrapper: "",
    pages: calcStoragePages(importData[fflate]),
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

const deployNewScriptyStorage = async () => {
  const ScriptyStorage = await hre.ethers.getContractFactory(
    "ScriptyStorageCloneable"
  );
  const createStorageCall = await scriptyStorageFactory.create();
  const createStorageResult = await createStorageCall.wait();
  const newStorageAddress = createStorageResult.logs[1]?.data.replace(
    "000000000000000000000000",
    ""
  );
  return await ScriptyStorage.attach(newStorageAddress);
};

const deployBaseContracts = async () => {
  console.log("Deploying base contracts...");

  // Deploy libs and factories
  scriptyBuilder = await (
    await hre.ethers.getContractFactory("ScriptyBuilder")
  ).deploy();
  await scriptyBuilder.deployed();
  console.log("ScriptyBuilder deployed", scriptyBuilder.address);

  frameLib = await (await hre.ethers.getContractFactory("Frame")).deploy();
  await frameLib.deployed();

  frameFactory = await (
    await hre.ethers.getContractFactory("FrameFactory")
  ).deploy(frameLib.address);
  await frameFactory.deployed();
  console.log("FrameFactory deployed", frameFactory.address);

  contentStoreLib = await (
    await hre.ethers.getContractFactory("ContentStore")
  ).deploy();
  await contentStoreLib.deployed();
  console.log("ContentStoreLib deployed", contentStoreLib.address);

  contentStoreFactory = await (
    await hre.ethers.getContractFactory("ContentStoreFactory")
  ).deploy(contentStoreLib.address);
  await contentStoreFactory.deployed();
  console.log("ContentStoreFactory deployed", contentStoreFactory.address);

  scriptyStorageLib = await (
    await hre.ethers.getContractFactory("ScriptyStorageCloneable")
  ).deploy();
  await scriptyStorageLib.deployed();
  console.log("ScriptyStorage deployed", scriptyStorageLib.address);

  scriptyStorageFactory = await (
    await hre.ethers.getContractFactory("ScriptyStorageFactory")
  ).deploy(scriptyStorageLib.address, contentStoreFactory.address);
  await scriptyStorageFactory.deployed();
  console.log("ScriptyStorageFactory deployed", scriptyStorageFactory.address);

  frameDeployer = await (
    await hre.ethers.getContractFactory("FrameDeployer")
  ).deploy(
    scriptyStorageFactory.address,
    frameFactory.address,
    scriptyBuilder.address
  );
  await frameDeployer.deployed();
  console.log("FrameDeployer deployed", frameDeployer.address);
};

const deployLibraries = async () => {
  libsScriptyStorage = await deployNewScriptyStorage();
  console.log("libsScriptyStorage", libsScriptyStorage.address);

  // Deploy libraries
  for (const libId in libs) {
    const lib = libs[libId];
    await libsScriptyStorage.createScript(libId, toBytes(""));
    await storeChunks(libsScriptyStorage, libId, lib.data, lib.pages);
  }
};

export const deployRawHTML = async (
  name: string,
  libNames: string[],
  sourcePath: string
) => {
  console.log('Deploying "TestHTML.html"...');

  // Deploy source
  const sourceScriptyStorage = await deployNewScriptyStorage();
  const sourceId = name + "-source";
  await sourceScriptyStorage.createScript(sourceId, toBytes(""));
  await storeChunks(
    sourceScriptyStorage,
    sourceId,
    fs.readFileSync(__dirname + sourcePath).toString(),
    1
  );

  // Create requests
  const requests = libNames
    .map((lib) =>
      createWrappedRequest(
        lib,
        libsScriptyStorage.address,
        libs[lib].wrapper === "gzip" ? 2 : 0
      )
    )
    .concat([createWrappedRequest(sourceId, sourceScriptyStorage.address, 0)]);

  console.log(requests);

  const bufferSize = await scriptyBuilder.getBufferSizeForEncodedHTMLWrapped(
    requests
  );

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
export const deployFrame = async (
  name: string,
  description: string,
  symbol: string,
  libs: string[],
  sourcePath: string
) => {
  console.log('Deploying frame "' + name + '"...');

  // Deploy source
  const sourceScriptyStorage = await deployNewScriptyStorage();
  const sourceId = name + "-source";
  await sourceScriptyStorage.createScript(sourceId, toBytes(""));
  await storeChunks(
    sourceScriptyStorage,
    sourceId,
    fs.readFileSync(__dirname + sourcePath).toString(),
    1
  );

  // Create requests
  const requests = libs
    .map((lib) => createWrappedRequest(lib, libsScriptyStorage.address, 2))
    .concat([createWrappedRequest(sourceId, sourceScriptyStorage.address, 0)]);

  const bufferSize = await scriptyBuilder.getBufferSizeForEncodedHTMLWrapped(
    requests
  );

  console.log("bufferSize", bufferSize.toString(), "requests", requests.length);

  const Frame = await hre.ethers.getContractFactory("Frame");
  const createCall = await frameDeployer.createFrame(
    {
      name,
      description,
      symbol,
    },
    bufferSize,
    requests
  );

  const createResult = await createCall.wait();
  const newFrameAddress = createResult.logs[0]?.data.replace(
    "000000000000000000000000",
    ""
  );

  console.log("Fetching tokenURI from on-chain...");

  const frame = await Frame.attach(newFrameAddress);
  const tokenURI = await frame.tokenURI(0);

  console.log(tokenURI);

  const html = decodeURIComponent(
    decodeURIComponent(
      JSON.parse(tokenURI.replace("data:application/json,", "")).animation_url
    )
  ).replace("data:text/html,", "");

  fs.writeFileSync(__dirname + "/output/output.html", html, {
    encoding: "utf8",
    flag: "w",
  });

  console.log(html);
  console.log(createResult.gasUsed);
};

export const init = async () => {
  await deployBaseContracts();
  await deployLibraries();
};

// init();
