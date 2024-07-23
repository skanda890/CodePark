// Get the canvas element and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set the canvas dimensions to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define the player object with initial properties
let player = {
    x: canvas.width / 2, // Start in the middle of the canvas
    y: canvas.height - 30, // Position near the bottom
    width: 50, // Player width
    height: 50, // Player height
    dx: 0 // Horizontal movement speed
};

// Array to store falling objects
let objects = [];
let score = 0; // Initialize score

// Function to draw the player on the canvas
function drawPlayer() {
    ctx.fillStyle = 'blue'; // Player color
    ctx.fillRect(player.x, player.y, player.width, player.height); // Draw player rectangle
}

// Function to draw falling objects on the canvas
function drawObjects() {
    ctx.fillStyle = 'red'; // Object color
    objects.forEach(obj => {
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height); // Draw each object
    });
}

// Function to update the position of falling objects
function updateObjects() {
    objects.forEach(obj => {
        obj.y += obj.dy; // Move object down
    });

    // Remove objects that have fallen off the screen
    objects = objects.filter(obj => obj.y < canvas.height);
}

// Function to create a new falling object
function createObject() {
    const x = Math.random() * (canvas.width - 20); // Random horizontal position
    objects.push({ x, y: 0, width: 20, height: 20, dy: 2 }); // Add new object to array
}

// Function to detect collisions between player and objects
function detectCollision() {
    objects.forEach((obj, index) => {
        if (obj.x < player.x + player.width &&
            obj.x + obj.width > player.x &&
            obj.y < player.y + player.height &&
            obj.y + obj.height > player.y) {
            objects.splice(index, 1); // Remove object on collision
            score++; // Increase score
        }
    });
}

// Function to update the player's position
function updatePlayer() {
    player.x += player.dx; // Move player horizontally

    // Prevent the player from moving out of bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Function to draw the current score on the canvas
function drawScore() {
    ctx.fillStyle = 'black'; // Score color
    ctx.font = '20px Arial'; // Score font
    ctx.fillText(`Score: ${score}`, 10, 20); // Draw score text
}

// Function to clear the canvas for redrawing
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire canvas
}

// Main game loop function
function gameLoop() {
    clearCanvas(); // Clear the canvas
    drawPlayer(); // Draw the player
    drawObjects(); // Draw the falling objects
    drawScore(); // Draw the score
    updateObjects(); // Update object positions
    updatePlayer(); // Update player position
    detectCollision(); // Check for collisions
    requestAnimationFrame(gameLoop); // Repeat the loop
}

// Event listener for key-down events to move the player
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') player.dx = 5; // Move right
    if (e.key === 'ArrowLeft') player.dx = -5; // Move left
});

// Event listener for key-up events to stop the player
document.addEventListener('keyup', () => {
    player.dx = 0; // Stop moving
});

// Create a new object every second
setInterval(createObject, 1000);

// Start the game loop
gameLoop();
