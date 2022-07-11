const hre = require("hardhat");
const dot = require("dot");
const fs = require("fs");
const ethers = hre.ethers;
const utils = hre.ethers.utils;
const toBytes = utils.toUtf8Bytes;

import base from "./assets/base";
import processing from "./assets/processing";
import d3 from "./assets/d3";
import three from "./assets/three";
import {
  staggerStore,
  constructRenderIndex,
  calcStoragePages,
} from "./utils/web3";
import { iImport, iWrapper } from "../../schema/types/frame";

const RENDER_PAGE_SIZE = 4;
let renderer: any = null;
let storage: any = null;

let frameDataStoreLib: any = null;
let frameDataStoreFactory: any = null;
let frameLib: any = null;
let frameFactory: any = null;
let coreDepsDataStore: any = null;

let frame: any = null;

let renderString: string = "";

type WrapperDataMap = {
  [key: string]: [string, string];
};

type ImportData = {
  data: string;
  wrapper: string;
  pages: number;
};

type ImportDataMap = {
  [key: string]: ImportData;
};

const wrappers: WrapperDataMap = {
  render: [
    '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head><body style="margin: 0px;">',
    "</body></html>",
  ],
  rawjs: ["<script>", "</script>"],
  b64jseval: ["<script>eval(atob('", "'));</script>"],
  gzhexjs: [
    "<script>window._assets = (window._assets||[]).concat(window.fflate.strFromU8(window.fflate.decompressSync(window.hexStringToArrayBuffer('",
    "'))));</script>",
  ],
};

const imports: ImportDataMap = {
  compressorGlobalB64: {
    data: base.compressorGlobalB64,
    wrapper: "b64jseval",
    pages: calcStoragePages(base.compressorGlobalB64),
  },
  p5gzhex: {
    data: processing.p5gzhex,
    wrapper: "gzhexjs",
    pages: calcStoragePages(processing.p5gzhex),
  },
  p5setup: {
    data: "eval(window._assets[0]);",
    wrapper: "rawjs",
    pages: 1,
  },
  d3topogzhex: {
    data: d3.d3topogzhex,
    wrapper: "gzhexjs",
    pages: calcStoragePages(d3.d3topogzhex),
  },
  threegzhex: {
    data: three.threegzhex,
    wrapper: "gzhexjs",
    pages: calcStoragePages(three.threegzhex),
  },
};

export const getImportScripts = (importKeys: string[]): Array<iImport> =>
  importKeys.map((ik) => {
    const imp = imports[ik];
    const { wrapper, data } = imp;
    const wrapperArr: string[] = wrappers[wrapper];
    return {
      html: wrapperArr[0] + data + wrapperArr[1],
      id: ik,
    };
  });

export const getWrapperScripts = (wrapperKeys: string[]): Array<iWrapper> =>
  wrapperKeys.map((wk) => {
    const wrapperArr: string[] = wrappers[wk];
    return {
      html: wrapperArr,
      id: wk,
    };
  });

export const renderFrameLocal = (
  importKeys: Array<string>,
  source: string
): string => {
  return (
    wrappers.render[0] +
    getImportScripts(importKeys) +
    source +
    wrappers.render[1]
  );
};

const deployDataStoreSetup = async () => {
  // base storage libs
  const FrameDataStore = await hre.ethers.getContractFactory("FrameDataStore");
  frameDataStoreLib = await FrameDataStore.deploy();
  console.log("frameDataStoreLib deployed at ", frameDataStoreLib.address);

  const FrameDataStoreFactory = await hre.ethers.getContractFactory(
    "FrameDataStoreFactory"
  );
  frameDataStoreFactory = await FrameDataStoreFactory.deploy();
  console.log(
    "frameDataStoreFactory deployed at ",
    frameDataStoreFactory.address
  );
  await frameDataStoreFactory.setLibraryAddress(frameDataStoreLib.address);
  console.log("frameDataStoreFactory lib address set ");
};

const deployFrameSetup = async () => {
  // base frame libs
  const Frame = await hre.ethers.getContractFactory("Frame");
  frameLib = await Frame.deploy();
  console.log("frameLib deployed at ", frameLib.address);

  const FrameFactory = await hre.ethers.getContractFactory("FrameFactory");
  frameFactory = await FrameFactory.deploy();
  console.log("frameFactory deployed at ", frameFactory.address);
  await frameFactory.setLibraryAddress(frameLib.address);
  console.log("frameFactory lib address set ");
};

const deployCoreDeps = async (
  importsKeys: string[],
  wrappersKeys: string[]
) => {
  const FrameDataStore = await hre.ethers.getContractFactory("FrameDataStore");
  // const Frame = await hre.ethers.getContractFactory("Frame");

  const createCall = await frameDataStoreFactory.createFrameDataStore.call();
  const createResult = await createCall.wait();
  const newStoreAddress = createResult.logs[0]?.data.replace(
    "000000000000000000000000",
    ""
  );
  console.log("newStoreAddress", newStoreAddress);
  coreDepsDataStore = await FrameDataStore.attach(newStoreAddress);
  // await newDataStore.saveData("test", 0, toBytes("test"));
  // const testResult = await newDataStore.getData("test", 0, 0);
  // console.log("newDataStore", testResult);

  const availImports = Object.keys(imports);
  const importsAreValid =
    importsKeys.filter((i) => availImports.indexOf(i) > -1).length ===
    importsKeys.length;

  console.log(importsAreValid);

  // let renderIndexParams = [[], RENDER_PAGE_SIZE];

  if (importsAreValid) {
    for (const ik of importsKeys) {
      const pages = imports[ik].pages;
      if (pages > 1) {
        await staggerStore(
          coreDepsDataStore,
          ik,
          imports[ik].data,
          imports[ik].pages
        );
      } else {
        await coreDepsDataStore.saveData(ik, 0, toBytes(imports[ik].pages));
      }
    }
  }

  for (const wk of wrappersKeys) {
    await coreDepsDataStore.saveData(
      wk + "Wrapper",
      0,
      toBytes(wrappers[wk][0])
    );
    await coreDepsDataStore.saveData(
      wk + "Wrapper",
      1,
      toBytes(wrappers[wk][1])
    );
  }
};

export const renderTemplate = async () => {
  const fileText = fs
    .readFileSync(__dirname + "/contract-templates/Render.sol")
    .toString();
  console.log(fileText);
  const template = dot.template(fileText);
  const result = template({ renderWrapper: "['RENDER_WRAPPER']" });
  console.log(result);

  const writeResult = fs.writeFileSync(
    __dirname + "/contracts/Render.sol",
    result,
    {
      encoding: "utf8",
      flag: "w",
    }
  );

  console.log(writeResult);
};

export const deploySource = async (source: string) => {
  console.log("deploySource", source);
  await storage.saveData("draw", 0, toBytes(source));
};

const deployNewFrame = async () => {
  const Frame = await hre.ethers.getContractFactory("Frame");

  const createCall = await frameFactory.createFrame(
    coreDepsDataStore.address,
    frameDataStoreFactory.address,
    [],
    [],
    []
  );
  const createResult = await createCall.wait();
  const newFrameAddress = createResult.logs[1]?.data.replace(
    "000000000000000000000000",
    ""
  );
  console.log("frame createResult", newFrameAddress, createResult.logs);
  frame = await Frame.attach(newFrameAddress);

  // const lib = await frameDataStoreFactory.libraryAddress();
  // const as = await frame.assetStorage();
  // console.log("newFrameAddress", frame.address, lib, as);

  const renderWrapper = await frame.renderWrapper();
  console.log("renderWrapper", renderWrapper);
};

const configureChainPipeline = async () => {
  // Set storage
  await renderer.setAssetStorage(storage.address);
  console.log("Render storage set to:", storage.address);
  const { compressorGlobalB64, p5gzhex } = imports;

  const renderIndexLocal = constructRenderIndex(
    [compressorGlobalB64.pages, p5gzhex.pages, 1, 1],
    RENDER_PAGE_SIZE
  );
  console.log("renderIndexLocal", renderIndexLocal);

  await renderer.setAssets();
  await renderer.setRenderIndex(renderIndexLocal);
};

export const renderFrame = async () => {
  let renderString = "";
  const renderPages = await frame.renderPagesCount();

  for (let i = 0; i < renderPages; i++) {
    console.log("fetching page", i);
    renderString = renderString + (await frame.renderPage(i));
  }

  console.log("renderString", renderString);

  return renderString;
};

export const deployDefaults = async () => {
  await deployDataStoreSetup();
  await deployFrameSetup();
  await deployCoreDeps(Object.keys(imports), Object.keys(wrappers));

  // // Session specific
  // await deploySource("");
  await deployNewFrame();
  // await renderFrame();

  // await configureChainPipeline();
};

export default {
  deployDefaults,
  deploySource,
  renderFrame,
  renderTemplate,
  getImportScripts,
};
