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
let libsContentStore: any;
let libsScriptyStorage: any;

const { p5 } = importIds;
const libs: ImportDataMap = {
  [p5]: {
    data: importData[p5],
    wrapper: "",
    pages: calcStoragePages(importData[p5]),
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

const deployBaseContracts = async () => {
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
  ).deploy();
  await frameFactory.deployed();
  console.log("FrameFactory deployed", frameFactory.address);

  contentStoreLib = await (
    await hre.ethers.getContractFactory("ContentStore")
  ).deploy();
  await contentStoreLib.deployed();
  console.log("ContentStoreLib deployed", contentStoreLib.address);

  contentStoreFactory = await (
    await hre.ethers.getContractFactory("ContentStoreFactory")
  ).deploy();
  await contentStoreFactory.deployed();
  console.log("ContentStoreFactory deployed", contentStoreFactory.address);

  scriptyStorageLib = await (
    await hre.ethers.getContractFactory("ScriptyStorageCloneable")
  ).deploy();
  await scriptyStorageLib.deployed();
  console.log("ScriptyStorage deployed", scriptyStorageLib.address);

  scriptyStorageFactory = await (
    await hre.ethers.getContractFactory("ScriptyStorageFactory")
  ).deploy();
  await scriptyStorageFactory.deployed();
  console.log("ScriptyStorageFactory deployed", scriptyStorageFactory.address);

  frameDeployer = await (
    await hre.ethers.getContractFactory("FrameDeployer")
  ).deploy(
    contentStoreFactory.address,
    scriptyStorageFactory.address,
    frameFactory.address,
    scriptyBuilder.address
  );
  await frameDeployer.deployed();
  console.log("FrameDeployer deployed", frameDeployer.address);
};

const deployLibraries = async () => {
  // TO-DO: make this factory based
  libsContentStore = await (
    await hre.ethers.getContractFactory("ContentStore")
  ).deploy();
  await libsContentStore.deployed();

  libsScriptyStorage = await (
    await hre.ethers.getContractFactory("ScriptyStorageCloneable")
  ).deploy();
  await libsScriptyStorage.deployed();

  // Configure new scriptyStorage
  await libsScriptyStorage.setContentStore(libsContentStore.address);

  // Deploy libraries
  for (const libId in libs) {
    const lib = libs[libId];
    await libsScriptyStorage.createScript(libId, toBytes(""));
    await storeChunks(libsScriptyStorage, libId, lib.data, lib.pages);
  }
};
export const deployFrame = async (
  name: string,
  symbol: string,
  libs: string[],
  sourcePath: string
) => {
  // Deploy source
  // TO-DO: make this factory based
  const sourcContentStore = await (
    await hre.ethers.getContractFactory("ContentStore")
  ).deploy();
  await sourcContentStore.deployed();

  const sourceScriptyStorage = await (
    await hre.ethers.getContractFactory("ScriptyStorageCloneable")
  ).deploy();
  await sourceScriptyStorage.deployed();

  // Configure new scriptyStorage
  const sourceId = name + "-source";
  await sourceScriptyStorage.setContentStore(sourcContentStore.address);
  await sourceScriptyStorage.createScript(sourceId, toBytes(""));
  await storeChunks(
    sourceScriptyStorage,
    sourceId,
    fs.readFileSync(__dirname + sourcePath).toString(),
    1
  );

  const sourceRequest = createWrappedRequest(
    sourceId,
    sourceScriptyStorage.address,
    0
  );

  // Create requests
  const requests = libs
    .map((lib) => createWrappedRequest(lib, libsScriptyStorage.address, 2))
    .concat([sourceRequest]);

  console.log(requests);

  const bufferSize = await scriptyBuilder.getBufferSizeForEncodedHTMLWrapped(
    requests
  );
  console.log("bufferSize", bufferSize);

  const query = await scriptyBuilder.getEncodedHTMLWrapped(
    requests,
    bufferSize
  );
  console.log("query", query.length);

  fs.writeFileSync(__dirname + "/output/" + name, fromBytes(query), {
    encoding: "utf8",
    flag: "w",
  });
};

export const deploy = async () => {
  await deployBaseContracts();
  await deployLibraries();
};
