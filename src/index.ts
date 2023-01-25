import { startServer } from "./app";
import { deploy, deployRawHTML } from "./deploy";
import { importIds } from "./assets/libs";
const fs = require("fs");

async function main() {
  const app = await startServer();
  const port = process.env.PORT || 3000;

  app.get("/", async (req, res) => {
    res.send(fs.readFileSync(__dirname + "/output/output.html").toString());
  });

  app.listen({ port }, async (): Promise<void> => {
    const { p5 } = importIds;

    console.log("Deploying base contracts...");
    await deploy();

    console.log('Deploying frame "TestFame"...');
    await deployRawHTML("TestFame", "TFRM", [p5], "/test/test.js");

    console.log(`\n🏂 Frame is now running on http://localhost:${port}/`);
  });
}
main();
