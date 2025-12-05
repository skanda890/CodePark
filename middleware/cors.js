/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing configuration
 * 
 * @param {string} allowedOrigin - The allowed origin (defaults to '*')
 * @returns {Function} Express middleware function
 */
module.exports = function cors(allowedOrigin) {
  return (req, res, next) => {
    res.header('Access-Control-Allow-Origin', allowedOrigin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  };
};
