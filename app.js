require("dotenv").config();
const express = require("express");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
