const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
// CORS options with more permissive settings
const corsOptions = {
  // Add all possible development and production origins
  origin: function(origin, callback) {
    // Allow any origin in development for easier testing
    // In production, this should be restricted
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Enable preflight for all routes
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
// You can add more routes as needed

// Add health check routes
const healthRoutes = require('./health');
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Forexprox API' });
});

// Add a health check route for /api
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is running',
    version: '1.0.0',
    status: 'online'
  });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});