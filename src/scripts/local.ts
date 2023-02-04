import { initLocal, deployFrameWithScript } from "../deploy";
import { importIds } from "../assets/libs";

async function start() {
  const { p5, three, inlineModule, gunzipInlineModules, gunzip } = importIds;

  await initLocal();
  await deployFrameWithScript(
    "Blue",
    "BBB",
    "Blue test.",
    [gunzip],
    "/test/blue.js",
    "localhost"
  );
}

start();
