import { ImportDataMap } from "../types/types";
import { calcStoragePages } from "../utils/web3";

const fs = require("fs");

export const importIds = {
  p5: "p5-v1.5.0.min.js.gz",
  three: "three-v0.149.0.module.min.js.gz",
  threeStats: "threeStats-v0.1.0.module.min.js.gz",
  threeOrbitControls: "threeOrbitControls-v0.1.0.module.min.js.gz",
  gunzipModules: "gunzipModules-v0.1.0.min.js",
};

const { p5, three, threeStats, threeOrbitControls, gunzipModules } = importIds;

export const importNames = {
  [p5]: "p5",
  [three]: "three",
  [threeStats]: "three-stats",
  [threeOrbitControls]: "three-orbit-controls",
  [gunzipModules]: "gunzip-modules",
};

export const MOD_WRAP = [
  encodeURIComponent('<script type="module" src="data:text/javascript;base64,'),
  encodeURIComponent('"></script>'),
];

export const getInlineModGzWrap = (name: string) => {
  return [
    encodeURIComponent(
      '<script type="text/inline-module+gzip" id="' +
        importNames[name] +
        '" src="data:text/javascript;base64,'
    ),
    encodeURIComponent('"></script>'),
  ];
};

export const importData = {
  [p5]: fs.readFileSync(__dirname + `/${p5}`).toString("base64"),
  [three]: fs.readFileSync(__dirname + `/${three}`).toString("base64"),
  [threeStats]: fs
    .readFileSync(__dirname + `/${threeStats}`)
    .toString("base64"),
  [threeOrbitControls]: fs
    .readFileSync(__dirname + `/${threeOrbitControls}`)
    .toString("base64"),
  [gunzipModules]: fs
    .readFileSync(__dirname + `/${gunzipModules}`)
    .toString("base64"),
};

const threeWrap = getInlineModGzWrap(three);
const threeStatsWrap = getInlineModGzWrap(threeStats);
const threeOrbitControlsWrap = getInlineModGzWrap(threeOrbitControls);

export const libs: ImportDataMap = {
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
  [threeStats]: {
    name: threeStats,
    data: importData[threeStats],
    wrapPrefix: threeStatsWrap[0],
    wrapSuffix: threeStatsWrap[1],
    wrapType: 4,
    pages: calcStoragePages(importData[threeStats]),
  },
  [threeOrbitControls]: {
    name: threeOrbitControls,
    data: importData[threeOrbitControls],
    wrapPrefix: threeOrbitControlsWrap[0],
    wrapSuffix: threeOrbitControlsWrap[1],
    wrapType: 4,
    pages: calcStoragePages(importData[threeOrbitControls]),
  },

  [gunzipModules]: {
    name: gunzipModules,
    data: importData[gunzipModules],
    wrapPrefix: "",
    wrapSuffix: "",
    wrapType: 1,
    pages: calcStoragePages(importData[gunzipModules]),
  },
};

export default {
  importData,
  importIds,
};
