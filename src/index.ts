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

import connectDB from "./config/db";

async function main() {
  await connectDB();

  const app = await startServer();
  const port = process.env.PORT || 3002;

  app.get("/", async (req, res) => {
    const result = await renderFrame();
    res.send(result);
  });

  app.listen({ port }, async (): Promise<void> => {
    console.log(
      `\n🚀GraphQL is now running on http://localhost:${port}/graphql `
    );

    Object.keys(wrappers).map((wk) => {
      writeLogs(getWrapperDataLogs(wk, wrappers[wk]), wk + ".json");
    });

    Object.keys(imports).map((ik) => {
      console.log(ik, imports[ik].pages);
      writeLogs(
        getLibDataLogs(ik, imports[ik].data, imports[ik].pages),
        ik + ".json"
      );
    });

    const {
      fflate,
      inlineModule,
      three,
      threeOrbitControls,
      threeTrackballControls,
      threeCSS3DRenderer,
      improvedNoise,
      stats,
      tween,
      webGL,
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
        improvedNoise,
        stats,
        tween,
        webGL,
      ],
      "/test/three-test-3.js"
    );
  });
}
main();
