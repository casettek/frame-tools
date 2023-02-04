import { ImportDataMap } from "../types/types";
import { calcStoragePages } from "../utils/web3";

const fs = require("fs");
export const importIds = {
  p5: "p5-v1.5.0.min.js",
  three: "three.module.min.js",
  inlineModule: "inlineModule.js",
  gunzipInlineModules: "gunzipInlineModules-0.0.1.js",
  gunzip: "gunzipScripts-0.0.1.js",
};

export const INLINE_MOD_GZIP_WRAP = [
  "%3Cscript%20type%3D%22text%2Finline-module%2Bgzip%22%20id%3D%22",
  "%22%20%3E%3C%2Fscript%3E",
];

export const MOD_WRAP = [
  encodeURIComponent('<script type="module" src="data:text/javascript;base64,'),
  encodeURIComponent('"></script>'),
];

export const getInlineModGzWrap = (name: string) => {
  return [
    encodeURIComponent(
      '<script type="text/inline-module+gzip" id="' +
        name +
        '" src="data:text/javascript;base64,'
    ),
    encodeURIComponent('"></script>'),
  ];
};

const { p5, three, gunzip, gunzipInlineModules, inlineModule } = importIds;

export const importData = {
  [p5]: fs.readFileSync(__dirname + "/p5-v1.5.0.min.js.gz").toString("base64"),
  [three]: fs
    .readFileSync(__dirname + "/three.module.min.js.gz")
    .toString("base64"),
  [inlineModule]: fs
    .readFileSync(__dirname + "/inlineModule.js")
    .toString("base64"),
  [gunzip]: fs
    .readFileSync(__dirname + "/gunzipScripts-0.0.1.js")
    .toString("base64"),
  [gunzipInlineModules]: fs
    .readFileSync(__dirname + "/gunzipInlineModules-0.0.1.js")
    .toString("base64"),
};

const threeWrap = getInlineModGzWrap(three);

console.log(importData.gunzipInlineModules);

export const libs: ImportDataMap = {
  [gunzip]: {
    name: gunzip,
    data: importData[gunzip],
    wrapPrefix: "",
    wrapSuffix: "",
    wrapType: 1,
    pages: calcStoragePages(importData[gunzip]),
  },
  [gunzipInlineModules]: {
    name: gunzipInlineModules,
    data: importData[gunzipInlineModules],
    wrapPrefix: "",
    wrapSuffix: "",
    wrapType: 1,
    pages: calcStoragePages(importData[gunzipInlineModules]),
  },
  [p5]: {
    name: p5,
    data: importData[p5],
    wrapPrefix: "",
    wrapSuffix: "",
    wrapType: 2,
    pages: calcStoragePages(importData[p5]),
  },
  [three]: {
    name: three,
    data: importData[three],
    wrapPrefix: threeWrap[0],
    wrapSuffix: threeWrap[1],
    wrapType: 4,
    pages: calcStoragePages(importData[three]),
  },
  [inlineModule]: {
    name: inlineModule,
    data: importData[inlineModule],
    wrapPrefix: "",
    wrapSuffix: "",
    wrapType: 1,
    pages: calcStoragePages(importData[inlineModule]),
  },
};

export default {
  importData,
  importIds,
};
