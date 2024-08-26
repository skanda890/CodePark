const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

// Sample schema and model
const Schema = mongoose.Schema;
const sampleSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
});

const Sample = mongoose.model('Sample', sampleSchema);

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Express app!');
});

app.get('/samples', async (req, res) => {
  try {
    const samples = await Sample.find();
    res.json(samples);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/samples', async (req, res) => {
  try {
    const sample = new Sample(req.body);
    await sample.save();
    res.status(201).send(sample);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
