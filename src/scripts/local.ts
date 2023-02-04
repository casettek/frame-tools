import { initLocal, deployFrameWithScript } from "../deploy";
import { importIds } from "../assets/libs";

async function start() {
  const { three, inlineModule, gunzipInlineModules, gunzip } = importIds;

  await initLocal();
  await deployFrameWithScript(
    "Blue",
    "BBB",
    "Blue test.",
    [three, gunzip, gunzipInlineModules, inlineModule],
    "/test/blue.js",
    "localhost"
  );
}

start();
