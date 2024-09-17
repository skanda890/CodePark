const { generateSudoku, solveSudoku } = require("sudoku-gen");

// Set the puzzle size and complexity level
const size = 9; // 9x9 grid
const complexity = 3; // Choose a complexity level (1 to 5)

// Generate the Sudoku puzzle and its solution
const sudokuPuzzle = generateSudoku(size, complexity);
const sudokuSolution = solveSudoku(sudokuPuzzle);

// Function to render the Sudoku grid (you'll need to implement this part)
function renderGrid(puzzle) {
    // Implement your logic to display the puzzle grid
    // For example, create HTML elements for each cell and populate them with puzzle values
    // You can use a table, divs, or canvas—whatever suits your design
}

// Show the solution when the button is clicked
const showSolutionButton = document.getElementById("showSolution");
showSolutionButton.addEventListener("click", () => {
    // Display the solution (you can customize this part based on your UI)
    console.log("Sudoku Solution:", sudokuSolution);
    // Alternatively, update your UI to show the solution
    // Example: renderGrid(sudokuSolution);
});

// Call the function to initially render the puzzle
renderGrid(sudokuPuzzle);
