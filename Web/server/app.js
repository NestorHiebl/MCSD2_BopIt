import express from "express";
import challenges from "./public/challenges.js";
import { generateUniqueRandomNum } from "./libs/util.js";

const app = express();
const port = 3003;
// Subscribed client to server sent events (with the option to add more than 1 client in the future)
let client = {
  id: null,
  res: null
};
let currentChallenge = null

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));

  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

// Bypass CORS to allow fetching data
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// GET a random challenge
const getRandomChallenge = (req, res) => {
  currentChallenge = challenges[generateUniqueRandomNum()]
  return res.status(200).send(currentChallenge);
};

// Subscribe to server sent events
const addSubscriber = (req, res) => {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);

  client.id = Date.now();
  client.res = res;
};

// Send a new random challenge
const sendNextChallenge = () => {
  currentChallenge = challenges[generateUniqueRandomNum()]
  client.res.write("data:" + JSON.stringify(currentChallenge));
  client.res.write("\n\n");
};

// Handle MCU POST request
const handleMCUPost = (req, res) => {
  console.log(req.body.mcu);
  console.log(req.body.cmd);

  const cmd = req.body.cmd;

  if(cmd === currentChallenge.cmd) {
    sendNextChallenge();
  }
  
  return res.status(200).send({
    error: false,
  });
};

// Define endpoints
app.get("/api/challenges", getRandomChallenge);
app.get("/api/subscribe", addSubscriber);
app.post("/api/challenges", handleMCUPost);

// Start the app
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
