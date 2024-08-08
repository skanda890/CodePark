// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createLogger, transports, format } from 'winston';
import { router as userRouter } from './routes/userRoutes.js';
import { router as productRouter } from './routes/productRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers.js';

// Initialize the Express app
const app = express();

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(morgan('combined')); // HTTP request logging

// Set up Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' })
  ]
});

// Route handlers
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
