// ====================================================
// Database Connection Setup (MongoDB)
//
// This file initializes the connection to the MongoDB database using Mongoose.
//
// Features:
// - Establishes a database connection.
// - Handles connection failures gracefully by exiting the process.
//
// Used by:
// - server/server.js (to connect to the database when the server starts)
// ====================================================

const mongoose = require('mongoose');

// Purpose:
// Connects the Node.js application to MongoDB.
//
// Input:
// None (uses MONGODB_URI environment variable or a local fallback URI).
//
// Output:
// None. Logs a success message on console or logs error and exits process on failure.
//
// Usage:
// Invoked once in server.js during startup.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal_pro');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
