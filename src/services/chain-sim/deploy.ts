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
  "html-wrap@1.0.0": [
    '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head><body style="margin: 0px;">',
    "</body></html>",
  ],
  "js-wrap@1.0.0": ['<script type="text/javascript">', "</script>"],
  "b64js-wrap@1.0.0": [
    '<script type="text/javascript">eval(atob("',
    '"));</script>',
  ],
  "hexgzjs-wrap@1.0.0": [
    '<script type="text/javascript">eval(window.fflate.strFromU8(window.fflate.decompressSync(window.hexStringToArrayBuffer("',
    '"))));</script>',
  ],
};

export const imports: ImportDataMap = {
  "gz-utils@1.0.0": {
    data: base.gzutilsb64,
    wrapper: "b64js-wrap@1.0.0",
    pages: calcStoragePages(base.gzutilsb64),
  },
  "p5@1.4.2": {
    data: processing.p5gzhex,
    wrapper: "hexgzjs-wrap@1.0.0",
    pages: calcStoragePages(processing.p5gzhex),
  },
  "d3@3.0.0": {
    data: d3.d3topogzhex,
    wrapper: "hexgzjs-wrap@1.0.0",
    pages: calcStoragePages(d3.d3topogzhex),
  },
  "three@0.142.0": {
    data: three.threegzhex,
    wrapper: "hexgzjs-wrap@1.0.0",
    pages: calcStoragePages(three.threegzhex),
  },
  "detect-provider@1.2.0": {
    data: base["detect-provider"],
    wrapper: "hexgzjs-wrap@1.0.0",
    pages: 1,
  },
  "htm@3.1.1": {
    data: base["htm"],
    wrapper: "hexgzjs-wrap@1.0.0",
    pages: 1,
  },
  "preact@10.10.6": {
    data: base["preact"],
    wrapper: "hexgzjs-wrap@1.0.0",
    pages: 1,
  },
  "tone@14.8.40": {
    data: base["tone"],
    wrapper: "hexgzjs-wrap@1.0.0",
    pages: calcStoragePages(base.tone),
  },
};

export const getImportScripts = (importKeys: string[]): Array<iImport> =>
  importKeys.map((ik) => {
    const imp = imports[ik];
    console.log("getImports", ik);
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

export const deployDataStoreSetup = async () => {
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

export const deployFrameSetup = async () => {
  // base frame libs
  const Frame = await hre.ethers.getContractFactory("Frame");
  frameLib = await Frame.deploy();
  console.log("frameLib deployed at ", frameLib.address);

  const FrameFactory = await hre.ethers.getContractFactory("FrameFactory");
  frameFactory = await FrameFactory.deploy();
  console.log("frameFactory deployed at ", frameFactory.address);
  await frameFactory.setLibraryAddress(frameLib.address);
  console.log("frameFactory lib address set");
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

export const deployCoreDeps = async (
  importsKeys: string[],
  wrappersKeys: string[]
) => {
  const FrameDataStore = await hre.ethers.getContractFactory("FrameDataStore");

  const createCall = await frameDataStoreFactory.createFrameDataStore.call();
  const createResult = await createCall.wait();
  const newStoreAddress = createResult.logs[0]?.data.replace(
    "000000000000000000000000",
    ""
  );

  coreDepsDataStore = await FrameDataStore.attach(newStoreAddress);

  const availImports = Object.keys(imports);
  const importsAreValid =
    importsKeys.filter((i) => availImports.indexOf(i) > -1).length ===
    importsKeys.length;

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
        await coreDepsDataStore.saveData(ik, 0, toBytes(imports[ik].data));
      }
    }
  }

  for (const wk of wrappersKeys) {
    console.log(wk + "Wrapper", " 0");
    console.log(Buffer.from(toBytes(wrappers[wk][0])).toString("hex"));
    console.log(wk + "Wrapper", " 1");
    console.log(Buffer.from(toBytes(wrappers[wk][1])).toString("hex"));
    // await coreDepsDataStore.saveData(
    //   wk + "Wrapper",
    //   0,
    //   toBytes(wrappers[wk][0])
    // );
    // await coreDepsDataStore.saveData(
    //   wk + "Wrapper",
    //   1,
    //   toBytes(wrappers[wk][1])
    // );
  }
  return;
};

export const deployNewFrame = async (
  deps: string[][],
  assets: string[][],
  deployAtomic: boolean
) => {
  // Construct renderIndex
  const depsPages: number[] = deps.map((d) => imports[d[1]].pages);
  const assetsPages: number[] = assets.map((a) => calcStoragePages(a[2]));
  const renderIndex: number[][] = constructRenderIndex(
    depsPages.concat(assetsPages),
    RENDER_PAGE_SIZE
  );
  const assetsMinusData = assets.map((a) => [a[0], a[1]]);
  const assetsData = assets.map((a) => toBytes(a[2]));

  console.log(renderIndex);
  console.log(assetsMinusData);
  console.log(assetsData.map((ad) => Buffer.from(ad).toString("hex")));

  // Deploy new frame with single source
  const Frame = await hre.ethers.getContractFactory("Frame");

  if (deployAtomic) {
    const createCall = await frameFactory.createFrameWithSources(
      coreDepsDataStore.address,
      frameDataStoreFactory.address,
      deps,
      assetsMinusData,
      assetsData,
      renderIndex
    );
    const createResult = await createCall.wait();
    // console.log(
    //   "createFrameWithSources",
    //   coreDepsDataStore.address,
    //   frameDataStoreFactory.address,
    //   deps,
    //   assetsMinusData,
    //   assetsData,
    //   renderIndex
    // );
    // console.log("createFrameWithSources result", createResult);
    // console.log(
    //   "tx cost",
    //   createResult.effectiveGasPrice.mul(createResult.gasUsed)
    // );

    const newFrameAddress = createResult.logs[1]?.data.replace(
      "000000000000000000000000",
      ""
    );
    frame = await Frame.attach(newFrameAddress);
  } else {
    // console.log(
    //   "createFrame",
    //   coreDepsDataStore.address,
    //   frameDataStoreFactory.address,
    //   deps,
    //   assetsMinusData,
    //   renderIndex
    // );

    const createCall = await frameFactory.createFrame(
      coreDepsDataStore.address,
      frameDataStoreFactory.address,
      deps,
      assetsMinusData,
      renderIndex
    );
    const createResult = await createCall.wait();
    const newFrameAddress = createResult.logs[1]?.data.replace(
      "000000000000000000000000",
      ""
    );
    frame = await Frame.attach(newFrameAddress);

    // Store Assets to frame
    const FrameDataStore = await hre.ethers.getContractFactory(
      "FrameDataStore"
    );
    const frDataStore = await FrameDataStore.attach(await frame.assetStorage());

    console.log(
      "frDataStoreAddress",
      frDataStore.address,
      await frame.coreDepStorage()
    );

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const key = asset[1];
      const data = asset[2];
      const pages = assetsPages[i];
      if (pages > 1) {
        await staggerStore(frDataStore, key, data, pages);
      } else {
        await frDataStore.saveData(key, 0, toBytes(data));
      }
    }
  }
};

export const renderFrame = async () => {
  // const FrameDataStore = await hre.ethers.getContractFactory("FrameDataStore");
  // const frAssetStorage = await FrameDataStore.attach(
  //   await frame.assetStorage()
  // );
  // const test1 = await frAssetStorage.getData("draw", 0, 0);
  // console.log("tests", test1);

  // const frCoreDepsStorage = await FrameDataStore.attach(
  //   await frame.coreDepStorage()
  // );
  // const test1 = await frCoreDepsStorage.getMaxPageNumber("compressorGlobalB64");
  // const test2 = await frCoreDepsStorage.getMaxPageNumber("p5gzhex");
  // const test3 = await frCoreDepsStorage.getMaxPageNumber("gzhexjsWrapper");
  // const test4 = await frCoreDepsStorage.getMaxPageNumber("renderWrapper");

  // console.log("renderframe storage test", test1, test2, test3, test4);

  let renderString = "";
  const pages = await frame.renderPagesCount();
  // const assetsCount = await frame.assetsCount();
  // const depsCount = await frame.depsCount();

  for (let i = 0; i < pages; i++) {
    const result = await frame.renderPage(i);
    // console.log("fetching page", i, result);
    renderString = renderString + result;
  }

  // console.log("renderFrame", renderString);

  return renderString;
};

export const deployDefaults = async () => {
  await deployDataStoreSetup();
  await deployFrameSetup();
  await deployCoreDeps(
    // libs
    [
      // "compressorGlobalB64",
      "p5gzhex",
    ],
    // wrappers
    ["render", "b64jseval", "gzhexjs", "rawjs"]
  );

  const { compressorGlobalB64, p5gzhex } = imports;
  // const renderIndexLocal = constructRenderIndex(
  //   [compressorGlobalB64.pages, p5gzhex.pages],
  //   RENDER_PAGE_SIZE
  // );

  // console.log("renderIndexLocal", renderIndexLocal);

  // await deployNewFrame(
  //   [
  //     // [compressorGlobalB64.wrapper, "compressorGlobalB64"],
  //     // [p5gzhex.wrapper, "p5gzhex"],
  //   ],
  //   [
  //     ["rawjs", "draw", "console.log('draw');"],
  //     // ["rawjs", "draw2", "console.log('draw2');"],
  //   ],
  //   true
  // );
  // await renderFrame();
};

export default {
  deployDefaults,
  renderFrame,
  renderTemplate,
  getImportScripts,
};
