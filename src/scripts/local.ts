import { initLocal, deployFrameWithScript } from "../deploy";
import { importIds } from "../assets/libs";

async function start() {
  const { p5gz, gunzip } = importIds;

  await initLocal();
  await deployFrameWithScript(
    "Matrix",
    "MTX",
    "The matrix thing",
    [p5gz, gunzip],
    "/test/matrix.js",
    "localhost"
  );
}

start();
