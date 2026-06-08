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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');
const { init: initSocket } = require('./config/socket');

// Validate critical environment variables
const requiredEnv = ['JWT_SECRET', 'MONGODB_URI'];
requiredEnv.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`WARNING: Environmental variable ${envVar} is missing!`);
  }
});

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO Server
initSocket(server);

// Connect to MongoDB Database
connectDB();

// Global Security & Request Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows browser to render uploaded local files across origins
})); 
app.use(cors({
  origin: '*', // Allow React client connection
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Basic Rate Limiting to prevent brute-force and DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Limit each IP to 100 requests in production, or 10000 during development/testing
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use(express.json()); // Parses incoming request bodies containing JSON payload data

// MongoDB Injection Protection Middleware (strips keys starting with $)
const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};
app.use(mongoSanitize);

// Ensure uploads directory exists and expose it statically
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', applicationRoutes); // Mount fallback apply route (e.g. /api/jobs/:id/apply)

// Root route (sanity ping verify)
app.get('/', (req, res) => {
  res.send('JobPortal Pro API is running...');
});

// Mount the global Error handling middleware (must be defined AFTER other app routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in production-ready mode on port ${PORT}`);
});
