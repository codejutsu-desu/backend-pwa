const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key", // Use a secure random secret in production
    resave: false,
    saveUninitialized: true,
  })
);

// Routes
app.use("/auth", authRoutes);

module.exports = app;
