// Option 1: Using Express Router (as you initially provided)
const express = require('express');
const router = express.Router();
const books = require('./books.json'); // Assume you have a JSON file with book data

// Get all books
router.get('/', (req, res) => {
  res.json(books);
});

// Get a specific book by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json(books.filter((ele) => ele.id === parseInt(id)));
});

// Add a new book
router.post('/', (req, res) => {
  const body = req.body;
  console.log(body); // Log the book data
  books.push(body);
  res.json({ message: 'The book has been added' });
});

// Update an existing book
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body;
  books.forEach((book, index) => {
    if (book.id === parseInt(id)) {
      books[index] = body;
    }
  });
  res.json({ message: `The book with ID ${id} has been updated` });
});

// Delete a book by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  books.forEach((book, index) => {
    if (book.id === parseInt(id)) {
      books.splice(index, 1);
    }
  });
  res.json({ message: `Book with ID ${id} has been deleted` });
});

module.exports = router;

// Option 2: Using Express directly
const express = require('express');
const app = express();
const port = 5000; // Set your desired port number

// ... other middleware and route setup ...

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
