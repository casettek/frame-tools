import { startServer } from "./app";
import {
  deployDefaults,
  renderTemplate,
  renderFrameLocal,
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
    // deployDefaults();
    // renderTemplate();

    const key = "tone@14.8.40";
    const imp = imports[key];
    logLibData(key, imp.data, imp.pages);
  });
}
main();
