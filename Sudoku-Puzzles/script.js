const { generateSudoku, solveSudoku } = require("sudoku-gen");

const size = 9; // 9x9 grid
const complexity = 3; // Choose a complexity level (1 to 5)
const sudokuPuzzle = generateSudoku(size, complexity);
const sudokuSolution = solveSudoku(sudokuPuzzle);

// Render the Sudoku grid (you'll need to implement this part)
// For simplicity, let's assume you have a function called renderGrid()

// Show the solution when the button is clicked
const showSolutionButton = document.getElementById("showSolution");
showSolutionButton.addEventListener("click", () => {
    console.log("Sudoku Solution:", sudokuSolution);
    // You can display the solution in an alert, a separate div, or any other way you prefer
});
