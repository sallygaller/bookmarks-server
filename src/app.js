require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const logger = require("./logger");
const bookmarksRouter = require("./bookmarks/bookmarks-router");

const app = express();

app.use(morgan(NODE_ENV === "production" ? "tiny" : "common"));
app.use(cors());
app.use(helmet());

app.use(function validateBearerToken(req, res, next) {
  console.log("Token validated!");
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");
  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: "Unauthorized request" });
  }
  next();
});

app.use(bookmarksRouter);

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
