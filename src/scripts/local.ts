import { initLocal, deployFrameWithScript } from "../deploy";
import { importIds } from "../assets/libs";

async function start() {
  const {
    three,
    threeStats,
    threeOrbitControls,
    inlineModule,
    gunzipInlineModules,
    gunzip,
  } = importIds;

  await initLocal();
  await deployFrameWithScript(
    "Blue",
    "BBB",
    "Blue test.",
    [
      three,
      threeStats,
      threeOrbitControls,
      gunzip,
      gunzipInlineModules,
      inlineModule,
    ],
    "/test/three1.min.js",
    "localhost"
  );
}

start();
