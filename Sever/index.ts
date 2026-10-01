// index.ts
import express from "express";

const app = express();
const port = 5000;

app.get("/", (req, res) => {
  res.send("Hello World..... from Bun + Express!!!!!");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
