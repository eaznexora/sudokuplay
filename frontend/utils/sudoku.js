// sudoku.js - Core Sudoku Logic
// Generates a complete board and a puzzle with empty cells depending on difficulty.

export const BLANK = 0;

export function generateSudoku(difficulty = 'Medium') {
  let board = Array.from({ length: 9 }, () => Array(9).fill(BLANK));
  fillBoard(board);
  
  // Create puzzle by removing numbers
  let puzzle = board.map(row => [...row]);
  let cellsToRemove = 40;
  
  if (difficulty === 'Easy') cellsToRemove = 30;
  else if (difficulty === 'Medium') cellsToRemove = 45;
  else if (difficulty === 'Hard') cellsToRemove = 55;
  
  while (cellsToRemove > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== BLANK) {
      puzzle[row][col] = BLANK;
      cellsToRemove--;
    }
  }
  
  return { solution: board, puzzle };
}

function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === BLANK) {
        let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffle(numbers);
        
        for (let num of numbers) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) {
              return true;
            }
            board[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function isValid(board, row, col, num) {
  // Check row
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num && i !== col) return false;
  }
  
  // Check column
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num && i !== row) return false;
  }
  
  // Check 3x3 box
  let startRow = Math.floor(row / 3) * 3;
  let startCol = Math.floor(col / 3) * 3;
  
  for (let i = startRow; i < startRow + 3; i++) {
    for (let j = startCol; j < startCol + 3; j++) {
      if (board[i][j] === num && i !== row && j !== col) return false;
    }
  }
  
  return true;
}

export function checkCompletion(board, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === BLANK || board[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}
