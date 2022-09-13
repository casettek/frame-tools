import { startServer } from "./app";
import {
  deployDefaults,
  deployFrame,
  renderFrame,
  writeLogs,
  imports,
} from "./frame";
import { getLibDataLogs, getWrapperDataLogs } from "./utils/web3";
import { wrappers, importIds } from "./assets/libs";
async function main() {
  const app = await startServer();
  const port = process.env.PORT || 3000;

  app.get("/", async (req, res) => {
    const result = await renderFrame();
    res.send(result);
  });

  app.listen({ port }, async (): Promise<void> => {
    console.log(`\n🏂 Frame is now running on http://localhost:${port}/`);

    Object.keys(wrappers).map((wk) => {
      writeLogs(
        getWrapperDataLogs(wk, wrappers[wk]),
        "wrappers/" + wk + ".json"
      );
    });

    Object.keys(imports).map((ik) => {
      writeLogs(
        getLibDataLogs(ik, imports[ik].data, imports[ik].pages),
        "libs/" + ik + ".json"
      );
    });

    const {
      fflate,
      inlineModule,
      three,
      threeOrbitControls,
      threeTrackballControls,
      threeCSS3DRenderer,
      threeImprovedNoise,
      threeStats,
      threeTween,
      threeWebGL,
      htmPreact,
    } = importIds;

    await deployDefaults();
    await deployFrame(
      [
        fflate,
        inlineModule,
        three,
        threeOrbitControls,
        threeTrackballControls,
        threeCSS3DRenderer,
        threeImprovedNoise,
        threeStats,
        threeTween,
        threeWebGL,
        htmPreact,
      ],
      "/test/three-import-test.js"
    );
  });
}
main();
