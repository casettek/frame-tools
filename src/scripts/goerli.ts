import { initGoerli, deployFrameWithScript } from "../deploy";
import { importIds } from "../assets/libs";

async function start() {
  const { p5gz, gunzip } = importIds;

  await initGoerli();

  // await deployFrameWithScript(
  //   "Matrix",
  //   "The matrix thing",
  //   "MTX",
  //   [p5gz, gunzip],
  //   "/test/matrix.js",
  //   "goerli"
  // );
}

start();
