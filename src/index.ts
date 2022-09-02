import { startServer } from "./app";
import { deployDefaults, renderFrame, writeLogs, imports } from "./frame";
import { getLibDataLogs, getWrapperDataLogs } from "./utils/web3";
import { wrappers } from "./assets/libs";

import connectDB from "./config/db";

async function main() {
  await connectDB();

  const app = await startServer();
  const port = process.env.PORT || 3002;

  app.get("/", async (req, res) => {
    const result = await renderFrame();
    res.send(result);
  });

  app.listen({ port }, (): void => {
    console.log(
      `\n🚀GraphQL is now running on http://localhost:${port}/graphql `
    );

    Object.keys(wrappers).map((wk) => {
      writeLogs(getWrapperDataLogs(wk, wrappers[wk]), wk + ".json");
    });

    Object.keys(imports).map((ik) => {
      writeLogs(
        getLibDataLogs(ik, imports[ik].data, imports[ik].pages),
        ik + ".json"
      );
    });

    deployDefaults();
  });
}
main();
