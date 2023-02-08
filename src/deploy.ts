import { ImportData } from "./types/types";
import { libs, MOD_WRAP } from "./assets/libs";
import { storeChunks, getLibDataLogs, toBytes } from "./utils/web3";

const hre = require("hardhat");
const fs = require("fs");

const createWrappedRequest = (lib: ImportData, contentStore: string) => ({
  name: lib.name,
  contractAddress: contentStore,
  contractData: toBytes(""),
  wrapType: lib.wrapType,
  wrapPrefix: toBytes(lib.wrapPrefix),
  wrapSuffix: toBytes(lib.wrapSuffix),
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

const deployBaseContracts = async (network: string) => {
  console.log("Deploying base contracts to " + network + "...");

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

  const scriptyStorageLib = await (
    await hre.ethers.getContractFactory("ScriptyStorage")
  ).deploy(contentStoreLib.address);
  await scriptyStorageLib.deployed();
  output.ScriptyStorage = scriptyStorageLib.address;
  console.log("ScriptyStorage deployed", scriptyStorageLib.address);

  const frameDeployer = await (
    await hre.ethers.getContractFactory("FrameDeployer")
  ).deploy(frameFactory.address, scriptyBuilder.address);
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

  console.log("Deployments now available at /deployments/" + network + ".json");
};

const deployLibraries = async (network: string) => {
  const dPath = __dirname + "/deployments/" + network + ".json";
  const deployments = JSON.parse(fs.readFileSync(dPath).toString());
  const ScriptyStorage = await hre.ethers.getContractFactory("ScriptyStorage");
  const storage = await ScriptyStorage.attach(deployments.ScriptyStorage);

  // Deploy libraries
  for (const libId in libs) {
    const lib = libs[libId];
    await storage.createScript(libId, toBytes(""));
    await storeChunks(storage, libId, lib.data, lib.pages);

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
    createWrappedRequest(libs[lib], deployments.ScriptyStorage)
  );

  const sourceRequest = createWrappedRequest(
    {
      name: sourceId,
      data: "",
      wrapPrefix: MOD_WRAP[0],
      wrapSuffix: MOD_WRAP[1],
      wrapType: 4,
      pages: 1,
    },
    deployments.ScriptyStorage
  );
  const requests = libsRequests.concat([sourceRequest]);
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
    requests,
    bufferSize
  );

  const createResult = await createCall.wait();
  const newFrameAddress = createResult.logs[
    createResult.logs.length - 1
  ]?.data.replace("000000000000000000000000", "");
  console.log("Frame deployed at", newFrameAddress);
  console.log("Fetching tokenURI...");

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

  console.log("Frame output now available");
  console.log("Gas used: ", createResult.gasUsed.toNumber());
};

export const initLocal = async () => {
  await deployBaseContracts("localhost");
  await deployLibraries("localhost");
};

export const initGoerli = async () => {
  await deployBaseContracts("goerli");
};
