import libData from "./assets/libs";
import {
  staggerStore,
  constructRenderIndex,
  calcStoragePages,
} from "./utils/web3";
import { iImport, iWrapper } from "./schema/types/frame";

const hre = require("hardhat");
const dot = require("dot");
const fs = require("fs");
const utils = hre.ethers.utils;
const toBytes = utils.toUtf8Bytes;

const RENDER_PAGE_SIZE = 4;

let frameDataStoreLib: any = null;
let frameDataStoreFactory: any = null;
let frameLib: any = null;
let frameFactory: any = null;
let coreDepsDataStore: any = null;

let frame: any = null;

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

export const importIds = {
  fflate: "fflate.umd.js@0.7.3",
  htmPreact: "htm-preact.module.js@3.1.1",
  three: "three.module.js@0.144.0",
  p5: "p5.module.js@1.4.2",
  tone: "tone.module.js@14.7.77",
};

const { fflate, htmPreact, three, p5, tone } = importIds;

const wrappers: WrapperDataMap = {
  "html-wrap.html@1.0.0": ["<!DOCTYPE html><html>", "</html>"],
  "head-wrap.html@1.0.0": [
    '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><script type="text/javascript">',
    "</script></head>",
  ],
  "body-wrap.html@1.0.0": ['<body style="margin: 0px">', "</body>"],
  "import-keys-wrap.js@1.0.0": [
    "const fks=[",
    '];const iks=fks.filter((fk)=>!fk.includes("' + fflate + '"));',
  ],
  "importmap-init-wrap.js@1.0.0": [
    "let idata=[];",
    'let imap=`{"imports":{`;for(ki in iks){imap=imap+`"${iks[ki].split(".")[0]}":"data:text/javascript;base64,${btoa(unescape(encodeURIComponent(idata[ki])))}"${ki<(iks.length-1)?",":""}`;}imap=imap+"}}";const s=document.createElement("script");s.type="importmap";s.innerHTML=imap;document.head.appendChild(s);',
  ],
  "js-script-wrap.html@1.0.0": ['<script type="text/javascript">', "</script>"],
  "js-module-wrap.html@1.0.0": ['<script type="module">', "</script>"],
  "b64-wrap.js@1.0.0": ['eval(atob("', '"));'],
  "b64-importmap-wrap.js@1.0.0": ['idata.push(atob("', '"));'],
  "b64-gz-importmap-wrap.js@1.0.0": [
    'idata.push(window.fflate.strFromU8(window.fflate.decompressSync(Uint8Array.from(atob("',
    '"),(c)=>c.charCodeAt(0)))));',
  ],
};

export const imports: ImportDataMap = {
  [fflate]: {
    data: libData[fflate],
    wrapper: "b64-wrap.js@1.0.0",
    pages: calcStoragePages(libData[fflate]),
  },
  [htmPreact]: {
    data: libData[htmPreact],
    wrapper: "b64-gz-importmap-wrap.js@1.0.0",
    pages: calcStoragePages(libData[htmPreact]),
  },
  [tone]: {
    data: libData[tone],
    wrapper: "b64-gz-importmap-wrap.js@1.0.0",
    pages: calcStoragePages(libData[tone]),
  },
  [three]: {
    data: libData[three],
    wrapper: "b64-gz-importmap-wrap.js@1.0.0",
    pages: calcStoragePages(libData[three]),
  },
  [p5]: {
    data: libData[p5],
    wrapper: "b64-gz-importmap-wrap.js@1.0.0",
    pages: calcStoragePages(libData[p5]),
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
    renderString = renderString + result;
  }

  return renderString;
};

export const deployDefaults = async () => {
  await deployDataStoreSetup();
  await deployFrameSetup();
  await deployCoreDeps(
    // all the libs
    [
      "fflate.umd.js@0.7.3",
      "htm-preact.module.js@3.1.1",
      "tone.module.js@14.7.77",
      "three.module.js@0.144.0",
      "p5.module.js@1.4.2",
    ],
    // all the wrappers
    [
      "html-wrap.html@1.0.0",
      "head-wrap.html@1.0.0",
      "body-wrap.html@1.0.0",
      "import-keys-wrap.js@1.0.0",
      "importmap-init-wrap.js@1.0.0",
      "js-module-wrap.html@1.0.0",
      "b64-wrap.js@1.0.0",
      "b64-gz-importmap-wrap.js@1.0.0",
    ]
  );

  await deployNewFrame(
    [
      [imports[fflate].wrapper, fflate],
      [imports[htmPreact].wrapper, htmPreact],
      [imports[three].wrapper, three],
      [imports[p5].wrapper, p5],
      [imports[tone].wrapper, tone],
    ],
    [
      [
        "js-module-wrap.html@1.0.0",
        "_source",
        fs.readFileSync(__dirname + "/test/source.js").toString(),
      ],
    ],
    constructRenderIndex(
      [
        imports[fflate].pages,
        imports[htmPreact].pages,
        imports[three].pages,
        imports[p5].pages,
        imports[tone].pages,
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
