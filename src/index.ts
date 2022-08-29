import { startServer } from "./app";
import {
  deployDefaults,
  renderTemplate,
  renderFrameLocal,
  renderLogs,
  imports,
} from "./services/chain-sim/deploy";

import { logLibData } from "./services/chain-sim/utils/web3";

import connectDB from "./config/db";

async function main() {
  await connectDB();

  const app = await startServer();
  const port = process.env.PORT || 3002;

  app.listen({ port }, (): void => {
    console.log(
      `\n🚀GraphQL is now running on http://localhost:${port}/graphql `
    );

    const key = "frame-utils@1.0.0";
    const imp = imports[key];
    let logs = logLibData(key, imp.data, imp.pages);
    // console.log(logs);
    renderLogs(logs);
  });
}
main();
