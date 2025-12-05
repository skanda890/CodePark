const express = require("express");
const { startCliGame } = require("./cliGame");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CodePark API",
    version: "1.0.0",
    status: "running",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Number guessing game endpoints (start a game and check a guess)
const games = new Map();

app.get("/game/guess", (req, res) => {
  const gameId = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  // store the secret number for this gameId
  games.set(gameId, randomNumber);
  // auto-expire the game after 10 minutes to avoid unbounded memory growth
  setTimeout(() => games.delete(gameId), 10 * 60 * 1000);

  res.json({
    message:
      "Number guessing game started! Try to guess a number between 1 and 100.",
    gameId,
    hint: 'POST /game/check with {"gameId":"<gameId>","guess": number} to check your guess',
  });
});

app.post("/game/check", (req, res) => {
  const { gameId, guess } = req.body || {};
  if (!gameId || typeof guess === "undefined") {
    return res
      .status(400)
      .json({ error: "Missing gameId or guess in request body" });
  }

  const target = games.get(gameId);
  if (typeof target === "undefined") {
    return res
      .status(404)
      .json({ error: "Game not found or already finished" });
  }

  const parsed = parseInt(guess, 10);
  if (Number.isNaN(parsed)) {
    return res.status(400).json({ error: "Invalid guess, must be a number" });
  }

  if (parsed < target) {
    return res.json({ result: "too low" });
  } else if (parsed > target) {
    return res.json({ result: "too high" });
  } else {
    games.delete(gameId);
    return res.json({ result: "correct" });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Centralized shutdown helper
function shutdown(code = 0) {
  console.log("Shutting down HTTP server...");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(code);
  });
}

// CLI Number Guessing Game (only if running in interactive mode)
if (process.stdin.isTTY && process.argv.includes("--game")) {
  startCliGame(() => shutdown(0));
}

// Graceful shutdown for both SIGTERM and SIGINT
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received");
  shutdown(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received");
  shutdown(0);
});

module.exports = app;
