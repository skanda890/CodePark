const express = require('express');
const app = express();

// Import routes
const userRoutes = require('./routes/userRoutes');

// Use routes
app.use('/users', userRoutes);

module.exports = app;
