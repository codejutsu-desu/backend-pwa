const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session); // Import MongoDB session store

// Load environment variables
dotenv.config();

// Initialize the Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow your frontend domain
    credentials: true, // Allow credentials (cookies)
  })
);
app.use(bodyParser.json());
app.use(express.static("public"));

// Set up MongoDB session store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions", // Collection name for storing sessions
});

// Handle session
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false, // Don't save uninitialized sessions
    store: store, // Use MongoDB store
    cookie: {
      secure: process.env.NODE_ENV === "production", // true if using HTTPS
      maxAge: 60000, // Set expiration time
      sameSite: "lax", // Adjust according to your needs
    },
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Import routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
