import { importIds, wrapperIds, importData, wrappers } from "./assets/libs";
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

const {
  fflate,
  htmPreact,
  p5,
  tone,
  three,
  threeOrbitControls,
  threeImprovedNoise,
  threeWebGL,
  threeStats,
  threeTween,
  threeTrackballControls,
  threeCSS3DRenderer,
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
      fflate,
      three,
      threeOrbitControls,
      threeImprovedNoise,
      threeWebGL,
      threeStats,
      threeTween,
      threeTrackballControls,
      threeCSS3DRenderer,
      p5,
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

  await deployNewFrame(
    [
      [imports[fflate].wrapper, fflate],
      [imports[three].wrapper, three],
      [imports[threeOrbitControls].wrapper, threeOrbitControls],
      [imports[threeStats].wrapper, threeStats],
      [imports[threeTween].wrapper, threeTween],
      [imports[threeTrackballControls].wrapper, threeTrackballControls],
      [imports[threeCSS3DRenderer].wrapper, threeCSS3DRenderer],
    ],
    [
      [
        jsModuleWrap,
        "_source",
        fs.readFileSync(__dirname + "/test/three-test-3.js").toString(),
      ],
    ],
    constructRenderIndex(
      [
        imports[fflate].pages,
        imports[three].pages,
        imports[threeOrbitControls].pages,
        imports[threeStats].pages,
        imports[threeTween].pages,
        imports[threeTrackballControls].pages,
        imports[threeCSS3DRenderer].pages,

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
