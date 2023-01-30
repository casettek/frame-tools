const fs = require("fs");
export const importIds = {
  p5gz: "p5.min.js.gz",
  gunzip: "gunzipScripts-0.0.1.js",
};

const { p5gz, gunzip } = importIds;

export const wrappers = {};

export const importData = {
  [p5gz]: fs.readFileSync(__dirname + "/p5.min.js.gz").toString("base64"),
  [gunzip]: fs
    .readFileSync(__dirname + "/gunzipScripts-0.0.1.js")
    .toString("base64"),
};

export default {
  importData,
  importIds,
  wrappers,
};
