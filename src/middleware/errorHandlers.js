export const notFoundHandler = (req, res, next) => {
  res.status(404).send('Resource not found');
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
};
