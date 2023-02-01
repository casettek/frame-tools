import { deployFrameWithScript, deployRawHTML } from "../deploy";
import { importIds } from "../assets/libs";

async function start() {
  const { p5gz, gunzip } = importIds;

  await deployFrameWithScript(
    "Matrix",
    "The matrix thing",
    "MTX",
    [p5gz, gunzip],
    "/test/matrix.js",
    "goerli"
  );
  // await deployRawHTML("Matrix", [p5gz, gunzip], "/test/matrix.js", "goerli");
  console.log("Frame output now available");
}

start();
