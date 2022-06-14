const hre = require("hardhat");
const toBytes = hre.ethers.utils.toUtf8Bytes;

import base from "./assets/base";
import processing from "./assets/processing";
import {
  staggerStore,
  constructRenderIndex,
  calcStoragePages,
} from "./utils/web3";
import roughSizeOfObject from "./utils/data";

const RENDER_PAGE_SIZE = 4;
let renderer: any = null;
let storage: any = null;
let renderString: string = "";

type ImportDataMap = {
  [key: string]: [string, number];
};

const importData: ImportDataMap = {
  compressorGlobalB64: [
    base.compressorGlobalB64,
    calcStoragePages(base.compressorGlobalB64),
  ],
  p5gzhex: [processing.p5gzhex, calcStoragePages(processing.p5gzhex)],
  p5setup: ["eval(atob(window._assets[0]));", 1],
};

const deployStorage = async () => {
  const Storage = await hre.ethers.getContractFactory("ContractDataStorage");
  storage = await Storage.deploy();
};

const deployGlobalImports = async (imports: string[]) => {
  const availImports = Object.keys(importData);
  const importsAreValid =
    imports.filter((i) => availImports.indexOf(i) > -1).length ===
    imports.length;

  // let renderIndexParams = [[], RENDER_PAGE_SIZE];

  if (importsAreValid) {
    for (const ik of imports) {
      const pages = importData[ik][1];
      if (pages > 1) {
        await staggerStore(storage, ik, importData[ik][0], importData[ik][1]);
      } else {
        await storage.saveData(ik, 0, toBytes(importData[ik][1]));
      }
    }
  }
};

export const deploySource = async (source: string) => {
  await storage.saveData("draw", 0, toBytes(source));
};

const deployRenderer = async () => {
  const Renderer = await hre.ethers.getContractFactory("Renderer");
  renderer = await Renderer.deploy();
  await renderer.deployed();
};

const configureChainPipeline = async () => {
  // Set storage
  await renderer.setAssetStorage(storage.address);
  console.log("Render storage set to:", storage.address);
  const { compressorGlobalB64, p5gzhex } = importData;

  const renderIndexLocal = constructRenderIndex(
    [compressorGlobalB64[1], p5gzhex[1], 1, 1],
    RENDER_PAGE_SIZE
  );
  console.log("renderIndexLocal", renderIndexLocal);

  await renderer.setAssets();
  await renderer.setRenderIndex(renderIndexLocal);
};

export const renderFrame = async () => {
  let renderString = "";
  const renderPages = await renderer.renderPagesCount();

  for (let i = 0; i < renderPages; i++) {
    console.log("fetching page", i);
    renderString = renderString + (await renderer.renderPage(i));
  }

  return renderString;
};

export const deployDefaults = async () => {
  await deployStorage();
  await deployGlobalImports(Object.keys(importData));

  // Session specific
  await deploySource("");
  await deployRenderer();
  await configureChainPipeline();
};

export default {
  deployDefaults,
  deploySource,
  renderFrame,
};
