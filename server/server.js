// ====================================================
// Server Entry Point (Bootstrap file)
//
// This is the starting file for the JobPortal Pro backend server.
// It loads configuration settings, connects to MongoDB database,
// configures CORS & JSON middlewares, and registers all API routes.
//
// Features:
// - Initializes connection to database.
// - Sets up Express app and JSON request parsing.
// - Sets up Cross-Origin Resource Sharing (CORS) so the frontend React client can talk to the backend.
// - Connects Authentication, Jobs, and Application routes.
// - Binds the global Error Handler middleware at the end.
// ====================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB Database
connectDB();

// Global Middlewares
app.use(cors()); // Allow request calls from different domain origins (like React local dev port)
app.use(express.json()); // Parses incoming request bodies containing JSON payload data

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api', applicationRoutes);

// Root route (sanity ping verify)
app.get('/', (req, res) => {
  res.send('JobPortal Pro API is running...');
});

// Mount the global Error handling middleware (must be defined AFTER other app routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
