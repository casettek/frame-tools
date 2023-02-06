import { initLocal, deployFrameWithScript } from "../deploy";
import { importIds } from "../assets/libs";

async function start() {
  const { three, threeStats, threeOrbitControls, gunzipModules, gunzip } =
    importIds;

  await initLocal();
  await deployFrameWithScript(
    "Blue",
    "BBB",
    "Blue test.",
    [three, threeStats, threeOrbitControls, gunzipModules],
    "/test/three1.js",
    // "/test/blue.js",
    "localhost"
  );
}

start();
