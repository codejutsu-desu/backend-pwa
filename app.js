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
    origin: process.env.EXPECTED_ORIGIN,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(express.static("public"));

// Create a session store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

// Middleware for session management
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true if using HTTPS
      maxAge: 60000,
      sameSite: "lax",
    },
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true, // Use the new URL parser
    useUnifiedTopology: true, // Use the new topology engine
    ssl: true, // Enable SSL
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if connection fails
  });

// Import routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Start the server
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not defined
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
