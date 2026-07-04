require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
