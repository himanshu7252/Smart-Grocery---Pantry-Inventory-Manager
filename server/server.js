require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes Configuration
const authRoutes = require('./routes/authRoutes');
const groceryRoutes = require('./routes/groceryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const shoppingRoutes = require('./routes/shoppingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/inventory', groceryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shopping-lists', shoppingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Grocery API is running smoothly',
    timestamp: new Date()
  });
});

// Root fallback route
app.get('/', (req, res) => {
  res.send('Smart Grocery List & Inventory Manager API Server');
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
