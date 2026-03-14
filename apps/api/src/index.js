const dotenv = require("dotenv");
const { createApp } = require("./app");

dotenv.config();

const app = createApp();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`CSC API listening on http://localhost:${port}`);
});
