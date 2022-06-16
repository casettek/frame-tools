const hre = require("hardhat");
const dot = require("dot");
const fs = require("fs");
const toBytes = hre.ethers.utils.toUtf8Bytes;

import base from "./assets/base";
import processing from "./assets/processing";
import {
  staggerStore,
  constructRenderIndex,
  calcStoragePages,
} from "./utils/web3";

const RENDER_PAGE_SIZE = 4;
let renderer: any = null;
let storage: any = null;
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

const wrappers = {
  render: [
    '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head><body>',
    "<div></div></body></html>",
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
    data: "eval(atob(window._assets[0]));",
    wrapper: "rawjs",
    pages: 1,
  },
};

export const renderFrameLocal = (
  importKeys: Array<string>,
  source: string
): string => {
  return (
    wrappers.render[0] +
    importKeys
      .map((ik) => {
        const imp = imports[ik];
        const { wrapper, data } = imp;
        return wrapper[0] + data + wrapper[1];
      })
      .reduce((a, b) => {
        return a + b;
      }, "") +
    source +
    wrappers.render[1]
  );
};

const deployStorage = async () => {
  const Storage = await hre.ethers.getContractFactory("ContractDataStorage");
  storage = await Storage.deploy();
};

const deployGlobalImports = async (importsKeys: string[]) => {
  const availImports = Object.keys(imports);
  const importsAreValid =
    importsKeys.filter((i) => availImports.indexOf(i) > -1).length ===
    importsKeys.length;

  // let renderIndexParams = [[], RENDER_PAGE_SIZE];

  if (importsAreValid) {
    for (const ik of importsKeys) {
      const pages = imports[ik].pages;
      if (pages > 1) {
        await staggerStore(storage, ik, imports[ik].data, imports[ik].pages);
      } else {
        await storage.saveData(ik, 0, toBytes(imports[ik].pages));
      }
    }
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

const deployRenderer = async () => {
  const Renderer = await hre.ethers.getContractFactory("Renderer");
  renderer = await Renderer.deploy();
  await renderer.deployed();
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
  const renderPages = await renderer.renderPagesCount();

  for (let i = 0; i < renderPages; i++) {
    console.log("fetching page", i);
    renderString = renderString + (await renderer.renderPage(i));
  }

  return renderString;
};

export const deployDefaults = async () => {
  await deployStorage();
  await deployGlobalImports(Object.keys(imports));

  // Session specific
  await deploySource("");
  await deployRenderer();
  await configureChainPipeline();
};

export default {
  deployDefaults,
  deploySource,
  renderFrame,
  renderTemplate,
};
