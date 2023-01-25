import { startServer } from "./app";
import { deploy, deployRawHTML, deployFrame } from "./deploy";
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

    await deploy();

    // await deployRawHTML("TestHTML.html", [p5], "/test/test.js");
    await deployFrame("TestHTML.html", "TFRM", [p5], "/test/test.js");

    console.log(`\n🏂 Frame is now running on http://localhost:${port}/`);
  });
}
main();
