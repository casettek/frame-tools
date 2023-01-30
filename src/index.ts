import { startServer } from "./app";
import { init, deployRawHTML, deployFrameWithScript } from "./deploy";
import { importIds } from "./assets/libs";
const fs = require("fs");

async function main() {
  const app = await startServer();
  const port = process.env.PORT || 3000;

  app.get("/", async (req, res) => {
    res.send(fs.readFileSync(__dirname + "/output/output.html").toString());
  });

  app.listen({ port }, async (): Promise<void> => {
    const { p5gz, gunzip } = importIds;

    await init();
    // await deployRawHTML("TestHTML.html", [p5gz, gunzip], "/test/test.js");
    await deployFrameWithScript(
      "TestHTML.html",
      "TFRM",
      "A test frame.",
      [p5gz, gunzip],
      "/test/test.js"
    );

    console.log(`\n🏂 Frame is now running on http://localhost:${port}/`);
  });
}
main();
