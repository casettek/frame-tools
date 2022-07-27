import { startServer } from "./app";
import {
  deployDefaults,
  renderTemplate,
  renderFrameLocal,
} from "./services/chain-sim/deploy";

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
  });
}
main();
