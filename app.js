const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

// Load environment variables
dotenv.config();

// Initialize the Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(express.static("public"));

// Create a session store
const store = new MongoDBStore({
  uri: "mongodb+srv://mrimmoys:mad9jaIGjV9DQVqx@users.htrt7.mongodb.net/",
  collection: "sessions",
});

// Middleware for session management
app.use(
  session({
    secret: "your-secret-key", // Use a secure, random string for production
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production" ? true : false, // Disable secure for localhost
      httpOnly: true,
    },
  })
);

// Connect to MongoDB
// Connect to MongoDB
mongoose
  .connect("mongodb+srv://mrimmoys:mad9jaIGjV9DQVqx@users.htrt7.mongodb.net/", {
    // ssl: true, // Enable SSL if needed
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if connection fails
  });

// Import routes
app.get("/", (req, res) => {
  res.send("Server started"); // Send the message directly as a response
});
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not defined
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
