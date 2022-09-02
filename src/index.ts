import { startServer } from "./app";
import {
  deployDefaults,
  deployNewFrame,
  renderFrame,
  renderLogs,
} from "./frame";
import { logLibData } from "./utils/web3";

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

    deployDefaults();

    // // LOGS
    // // const key = "htm-preact@3.1.1";
    // // const key = "frame-utils@1.0.0";
    // const key = "tone@14.8.40";
    // const imp = imports[key];
    // let logs = logLibData(key, imp.data, imp.pages);
    // // console.log(logs);
    // renderLogs(logs);
  });
}
main();
