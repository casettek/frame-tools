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

const RENDER_PAGE_SIZE = 2;
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
  "html-wrap@1.0.0": ["<!DOCTYPE html><html>", "</html>"],
  // [0x3c21444f43545950452068746d6c3e3c68746d6c3e, 0x3c2f68746d6c3e]
  "head-html-wrap@1.0.0": [
    '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><script type="text/javascript">',
    "</script></head>",
  ],
  // [0x3c686561643e3c6d65746120687474702d65717569763d22436f6e74656e742d547970652220636f6e74656e743d22746578742f68746d6c3b20636861727365743d5554462d38222f3e3c73637269707420747970653d22746578742f6a617661736372697074223e, 0x3c2f7363726970743e3c2f686561643e]
  "body-html-wrap@1.0.0": ['<body style="margin: 0px">', "</body>"],
  // [0x3c626f6479207374796c653d226d617267696e3a20307078223e, 0x3c2f626f64793e]
  "import-keys-js-wrap@1.0.0": [
    "const fks=[",
    '];const iks = fks.filter((fk) => !fk.includes("frame-utils"));',
  ],
  // [0x636f6e737420666b733d5b, 0x5d3b636f6e737420696b73203d20666b732e66696c7465722828666b29203d3e2021666b2e696e636c7564657328226672616d652d7574696c732229293b]
  "importmap-init-js-wrap@1.0.0": [
    "let idata = [];",
    'let imap = `{ "imports": { `; for (ki in iks) { imap = imap + `"${ iks[ki].split("@")[0] }": "data:text/javascript;base64,${btoa(idata[ki])}"${ ki < (iks.length - 1) ? "," : "" }`; } imap = imap + "} }"; const s = document.createElement("script"); s.type = "importmap"; s.innerHTML = imap; document.head.appendChild(s);',
  ],
  // [0x6c6574206964617461203d205b5d3b, 0x6c657420696d6170203d20607b2022696d706f727473223a207b20603b20666f7220286b6920696e20696b7329207b20696d6170203d20696d6170202b206022247b20696b735b6b695d2e73706c697428224022295b305d207d223a2022646174613a746578742f6a6176617363726970743b6261736536342c247b62746f612869646174615b6b695d297d22247b206b69203c2028696b732e6c656e677468202d203129203f20222c22203a202222207d603b207d20696d6170203d20696d6170202b20227d207d223b20636f6e73742073203d20646f63756d656e742e637265617465456c656d656e74282273637269707422293b20732e74797065203d2022696d706f72746d6170223b20732e696e6e657248544d4c203d20696d61703b20646f63756d656e742e686561642e617070656e644368696c642873293b]

  /* -- */
  "js-script-wrap@1.0.0": ['<script type="text/javascript">', "</script>"],
  // [0x3C73637269707420747970653D22746578742F6A617661736372697074223E, 0x3C2F7363726970743E]
  "js-module-wrap@1.0.0": ['<script type="module">', "</script>"],
  // [0x3C73637269707420747970653D226D6F64756C65223E, 0x3C2F7363726970743E]
  "b64-js-wrap@1.0.0": ['eval(atob("', '"));'],
  // [0x6576616C2861746F622822, 0x2229293B]
  "b64-importmap-js-wrap@1.0.0": ['idata.push(atob("', '"));'],
  // [0x69646174612e707573682861746f622822, 0x2229293b]
  "b64-gz-importmap-js-wrap@1.0.0": [
    'idata.push(window.fflate.strFromU8(window.fflate.decompressSync(Uint8Array.from(atob("',
    '"),(c)=>c.charCodeAt(0)))));',
  ],
  // [0x69646174612e707573682877696e646f772e66666c6174652e73747246726f6d55382877696e646f772e66666c6174652e6465636f6d707265737353796e632855696e743841727261792e66726f6d2861746f622822, 0x22292c2863293d3e632e63686172436f64654174283029292929293b]
};

export const imports: ImportDataMap = {
  "frame-utils@1.0.0": {
    data: base.gzutilsb64,
    // data: "[[frame-utils@1.0.0]]",
    wrapper: "b64-js-wrap@1.0.0",
    pages: calcStoragePages(base.gzutilsb64),
  },
  "htm-preact@3.1.1": {
    data: base["htmPreact"],
    // data: "[[preact@10.10.6]]",
    wrapper: "b64-gz-importmap-js-wrap@1.0.0",
    pages: calcStoragePages(base["htmPreact"]),
  },
  "tone@14.8.40": {
    data: base["tone"],
    // data: "[[tone@14.8.40]]",
    wrapper: "b64-gz-importmap-js-wrap@1.0.0",
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

export const renderLogs = async (logs: any) => {
  const writeResult = fs.writeFileSync(
    __dirname + "/logs/logs.json",
    Buffer.from(JSON.stringify(logs), "utf-8"),
    {
      encoding: "utf8",
      flag: "w",
    }
  );
};

export const deployCoreDeps = async (
  importsKeys: string[],
  wrappersKeys: string[]
) => {
  const FrameDataStore = await hre.ethers.getContractFactory("FrameDataStore");

  const createCall = await frameDataStoreFactory.createFrameDataStore(
    "frame-tools",
    "1.0.0"
  );
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
      console.log("storing ", ik, " over ", pages, " pages");
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
    console.log("storing ", wk);
    await coreDepsDataStore.saveData(wk, 0, toBytes(wrappers[wk][0]));
    await coreDepsDataStore.saveData(wk, 1, toBytes(wrappers[wk][1]));
  }
  // console.log(
  //   "done storing deps",
  //   coreDepsDataStore.address,
  //   wrappersKeys[0],
  //   await coreDepsDataStore.getData(wrappersKeys[0], 0, 1)
  // );
  return;
};

export const deployNewFrame = async (
  deps: string[][],
  assets: string[][],
  renderIndex: number[][]
  // deployAtomic: boolean
) => {
  // Construct renderIndex
  const depsPages: number[] = deps.map((d) => imports[d[1]].pages);
  const assetsPages: number[] = assets.map((a) => calcStoragePages(a[2]));
  const assetsMinusData = assets.map((a) => [a[0], a[1]]);
  const assetsData = assets.map((a) => toBytes(a[2]));

  console.log("deploying new frame", [deps, assetsMinusData], renderIndex);

  // Deploy new frame with single source
  const Frame = await hre.ethers.getContractFactory("Frame");

  const createCall = await frameFactory.createFrameWithSource(
    coreDepsDataStore.address,
    frameDataStoreFactory.address,
    [deps, assetsMinusData],
    assetsData,
    renderIndex,
    "test frame"
  );

  const createResult = await createCall.wait();
  const newFrameAddress = createResult.logs[1]?.data.replace(
    "000000000000000000000000",
    ""
  );
  frame = await Frame.attach(newFrameAddress);
};

export const renderFrame = async () => {
  let renderString = "";
  const pages = await frame.renderPagesCount();

  for (let i = 0; i < pages; i++) {
    const result = await frame.renderPage(i);
    // console.log("fetching page", i, result);
    renderString = renderString + result;
  }

  return renderString;
};

export const deployDefaults = async () => {
  await deployDataStoreSetup();
  await deployFrameSetup();
  await deployCoreDeps(
    // libs
    ["frame-utils@1.0.0", "htm-preact@3.1.1", "tone@14.8.40"],
    // wrappers
    [
      "html-wrap@1.0.0",
      "head-html-wrap@1.0.0",
      "body-html-wrap@1.0.0",
      "import-keys-js-wrap@1.0.0",
      "importmap-init-js-wrap@1.0.0",
      "js-module-wrap@1.0.0",
      "b64-js-wrap@1.0.0",
      "b64-gz-importmap-js-wrap@1.0.0",
    ]
  );

  await deployNewFrame(
    [
      [imports["frame-utils@1.0.0"].wrapper, "frame-utils@1.0.0"],
      [imports["htm-preact@3.1.1"].wrapper, "htm-preact@3.1.1"],
      [imports["tone@14.8.40"].wrapper, "tone@14.8.40"],
    ],
    [["js-module-wrap@1.0.0", "_source", "console.log('test');"]],
    constructRenderIndex(
      [
        imports["frame-utils@1.0.0"].pages,
        imports["htm-preact@3.1.1"].pages,
        imports["tone@14.8.40"].pages,
        1,
      ],
      RENDER_PAGE_SIZE
    )
  );
};

export default {
  deployDefaults,
  renderFrame,
  renderTemplate,
  getImportScripts,
};
