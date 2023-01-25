import { startServer } from "./app";
import { deploy, deployFrame } from "./deploy";
import { importIds } from "./assets/libs";
const fs = require("fs");

async function main() {
  const app = await startServer();
  const port = process.env.PORT || 3000;

  app.get("/", async (req, res) => {
    const result = fs
      .readFileSync(__dirname + "/output/TestFame")
      .toString()
      .replace("data:text/html;base64,", "");
    res.send(Buffer.from(result, "base64").toString("utf8"));
  });

  app.listen({ port }, async (): Promise<void> => {
    const { p5 } = importIds;

    console.log("Deploying base contracts...");
    await deploy();

    console.log('Deploying frame "TestFame"...');
    await deployFrame("TestFame", "TFRM", [p5], "/test/test.js");

    console.log(`\n🏂 Frame is now running on http://localhost:${port}/`);
  });
}
main();
