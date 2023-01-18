import { importIds, wrapperIds, importData, wrappers } from "./assets/libs";
import {
  staggerStore,
  constructRenderIndex,
  calcStoragePages,
} from "./utils/web3";

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

const {
  fflate,
  inlineModule,
  htmPreact,
  p5,
  tone,
  three,
  threeOrbitControls,
  threeTrackballControls,
  threeCSS3DRenderer,
  threeWebGL,
  threeStats,
  threeTween,
  threeImprovedNoise,
} = importIds;
const {
  htmlWrap,
  headWrap,
  bodyWrap,
  importKeysWrap,
  importmapInitWrap,
  jsModuleWrap,
  b64Wrap,
  b64GzImportmapWrap,
} = wrapperIds;

export const imports: ImportDataMap = {
  [fflate]: {
    data: importData[fflate],
    wrapper: b64Wrap,
    pages: calcStoragePages(importData[fflate]),
  },
  [inlineModule]: {
    data: importData[inlineModule],
    wrapper: b64Wrap,
    pages: calcStoragePages(importData[inlineModule]),
  },
  [htmPreact]: {
    data: importData[htmPreact],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[htmPreact]),
  },
  [tone]: {
    data: importData[tone],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[tone]),
  },
  [p5]: {
    data: importData[p5],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[p5]),
  },
  [three]: {
    data: importData[three],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[three]),
  },
  [threeOrbitControls]: {
    data: importData[threeOrbitControls],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[threeOrbitControls]),
  },
  [threeWebGL]: {
    data: importData[threeWebGL],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[threeWebGL]),
  },
  [threeImprovedNoise]: {
    data: importData[threeImprovedNoise],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[threeImprovedNoise]),
  },
  [threeStats]: {
    data: importData[threeStats],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[threeStats]),
  },
  [threeTween]: {
    data: importData[threeTween],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[threeTween]),
  },
  [threeTrackballControls]: {
    data: importData[threeTrackballControls],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[threeTrackballControls]),
  },
  [threeCSS3DRenderer]: {
    data: importData[threeCSS3DRenderer],
    wrapper: b64GzImportmapWrap,
    pages: calcStoragePages(importData[threeCSS3DRenderer]),
  },
};

export const getImportScripts = (importKeys: string[]) =>
  importKeys.map((ik) => {
    const imp = imports[ik];
    const { wrapper, data } = imp;
    const wrapperArr: string[] = wrappers[wrapper];
    return {
      html: wrapperArr[0] + data + wrapperArr[1],
      id: ik,
    };
  });

export const getWrapperScripts = (wrapperKeys: string[]) =>
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

export const writeLogs = async (logs: any, fileName: string) => {
  fs.writeFileSync(
    __dirname + "/logs/" + fileName,
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
  return;
};

type Asset = {
  wrapperKey: string;
  key: string;
  wrapperStore: string;
  store?: string;
};

export const deployNewFrame = async (
  deps: string[][],
  assets: string[][],
  renderIndex: number[][]
) => {
  // console.log("deploy", deps, assets);
  const _deps: Asset[] = deps
    .map(
      (d): Asset => ({
        wrapperKey: d[0],
        key: d[1],
        wrapperStore: coreDepsDataStore.address,
        store: coreDepsDataStore.address,
      })
    )
    .concat(
      assets.map(
        (d): Asset => ({
          wrapperKey: d[0],
          key: d[1],
          wrapperStore: coreDepsDataStore.address,
          store: "0x0000000000000000000000000000000000000000",
        })
      )
    );

  const assetsData = assets.map((a) => toBytes(a[2]));

  console.log(
    "deploying new frame",
    frameDataStoreFactory.address,
    _deps,
    assetsData,
    coreDepsDataStore.address,
    renderIndex
  );

  const Frame = await hre.ethers.getContractFactory("Frame");

  const createCall = await frameFactory.createFrameWithSource(
    frameDataStoreFactory.address,
    _deps,
    assetsData,
    coreDepsDataStore.address,
    renderIndex,
    "test frame"
  );

  const createResult = await createCall.wait();
  const newFrameAddress = createResult.logs[1]?.data.replace(
    "000000000000000000000000",
    ""
  );
  frame = await Frame.attach(newFrameAddress);

  const test1 = await frame.depsList(0);
  const test2 = await frame.depsList(1);
  const test3 = await frame.depsList(2);
  const test4 = await frame.depsList(3);
  const test5 = await frame.depsCount();
  const test6 = await frame.sourceStore();

  console.log(test1, test2, test3, test4, test5, test6);
};

export const renderFrame = async () => {
  let renderString = "";
  const pages = await frame.renderPagesCount();

  for (let i = 0; i < pages.toNumber(); i++) {
    console.log("fetching page ", i, " of ", pages.toNumber());
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
      fflate,
      inlineModule,
      three,
      threeOrbitControls,
      threeImprovedNoise,
      threeWebGL,
      threeStats,
      threeTween,
      threeTrackballControls,
      threeCSS3DRenderer,
      p5,
      tone,
      htmPreact,
    ],
    // all the wrappers
    [
      htmlWrap,
      headWrap,
      bodyWrap,
      importKeysWrap,
      importmapInitWrap,
      jsModuleWrap,
      b64Wrap,
      b64GzImportmapWrap,
    ]
  );
};

export const deployFrame = async (keys: string[], sourcePath: string) => {
  await deployNewFrame(
    keys.map((k: string) => [imports[k].wrapper, k]),
    [
      [
        jsModuleWrap,
        "_source",
        fs.readFileSync(__dirname + sourcePath).toString(),
      ],
    ],
    constructRenderIndex(
      keys.map((k: string) => imports[k].pages).concat([1]),
      RENDER_PAGE_SIZE
    )
  );
};

export const deployWithScripty = async (keys: string[], sourcePath: string) => {
  const ethfsContentStore = await (
    await hre.ethers.getContractFactory("ContentStore")
  ).deploy();
  await ethfsContentStore.deployed();

  const ethfsFileStore = await (
    await hre.ethers.getContractFactory("FileStore")
  ).deploy(ethfsContentStore.address);
  await ethfsFileStore.deployed();

  const scriptyStorageContract = await (
    await hre.ethers.getContractFactory("ScriptyStorage")
  ).deploy(ethfsContentStore.address);
  await scriptyStorageContract.deployed();
  console.log("ScriptyStorage deployed", scriptyStorageContract.address);

  const scriptyBuilderContract = await (
    await hre.ethers.getContractFactory("ScriptyBuilder")
  ).deploy();
  await scriptyBuilderContract.deployed();
  console.log("ScriptyBuilder deployed", scriptyBuilderContract.address);

  const ethfsFileStorageContract = await (
    await hre.ethers.getContractFactory("ETHFSFileStorage")
  ).deploy(ethfsFileStore.address);
  await ethfsFileStorageContract.deployed();
  console.log("ETHFSFileStorage deployed", ethfsFileStorageContract.address);
};

export default {
  deployDefaults,
  deployWithScripty,
  deployFrame,
  renderFrame,
  renderTemplate,
  getImportScripts,
};
