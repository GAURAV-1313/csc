const dotenv = require("dotenv");
const path = require("path");
const { createApp } = require("./app");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = createApp();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`CSC API listening on http://localhost:${port}`);
});
