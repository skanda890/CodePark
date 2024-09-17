const { generateSudoku, solveSudoku } = require("sudoku-gen");

const size = 9;
const complexity = 3;

const sudokuPuzzle = generateSudoku(size, complexity);
const sudokuSolution = solveSudoku(sudokuPuzzle);

function renderGrid(puzzle) {
    for (let row = 0; row < size; row++) {
        console.log(puzzle[row].join(" "));
    }
}

const showSolutionButton = document.getElementById("showSolution");
showSolutionButton.addEventListener("click", () => {
    console.log("Sudoku Solution:", sudokuSolution);
});

renderGrid(sudokuPuzzle);
