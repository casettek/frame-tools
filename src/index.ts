import { startServer } from "./app";
const fs = require("fs");

async function main() {
  const app = await startServer();
  const port = process.env.PORT || 3000;

  app.get("/", async (req, res) => {
    res.send(fs.readFileSync(__dirname + "/output/output.html").toString());
  });

  app.listen({ port }, async (): Promise<void> => {
    console.log(`\n🏂 Frame is now running on http://localhost:${port}/`);
  });
}
main();
