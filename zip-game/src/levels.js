export const levels = {
  easy: {
    size: 5,
    numbers: [
      { num: 1, row: 0, col: 0 },
      { num: 2, row: 0, col: 2 },
      { num: 3, row: 0, col: 4 },
      { num: 4, row: 2, col: 4 },
      { num: 5, row: 2, col: 2 },
      { num: 6, row: 4, col: 2 },
      { num: 7, row: 4, col: 0 },
      { num: 8, row: 2, col: 0 },
    ],
    walls: [],
    // Snake path covering entire 5x5 = 25 cells
    path: [
      [0,0],[0,1],[0,2],[0,3],[0,4],
      [1,4],[1,3],[1,2],[1,1],[1,0],
      [2,0],[2,1],[2,2],[2,3],[2,4],
      [3,4],[3,3],[3,2],[3,1],[3,0],
      [4,0],[4,1],[4,2],[4,3],[4,4],
    ],
  },

  medium: {
    size: 6,
    numbers: [
      { num: 1,  row: 0, col: 0 },
      { num: 2,  row: 0, col: 5 },
      { num: 3,  row: 2, col: 5 },
      { num: 4,  row: 2, col: 3 },
      { num: 5,  row: 2, col: 1 },
      { num: 6,  row: 4, col: 1 },
      { num: 7,  row: 4, col: 3 },
      { num: 8,  row: 4, col: 5 },
      { num: 9,  row: 5, col: 5 },
      { num: 10, row: 5, col: 0 },
    ],
    walls: [],
    // Full 6x6 = 36 cell coverage
    path: [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],
      [1,5],[1,4],[1,3],[1,2],[1,1],[1,0],
      [2,0],[2,1],[2,2],[2,3],[2,4],[2,5],
      [3,5],[3,4],[3,3],[3,2],[3,1],[3,0],
      [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],
      [5,5],[5,4],[5,3],[5,2],[5,1],[5,0],
    ],
  },

  hard: {
    size: 7,
    // Checkpoints scattered across the grid, visited in order along the snake
    numbers: [
      { num: 1,  row: 0, col: 0 },
      { num: 2,  row: 0, col: 5 },
      { num: 3,  row: 1, col: 4 },
      { num: 4,  row: 1, col: 0 },
      { num: 5,  row: 2, col: 3 },
      { num: 6,  row: 3, col: 5 },
      { num: 7,  row: 3, col: 1 },
      { num: 8,  row: 4, col: 2 },
      { num: 9,  row: 5, col: 6 },
      { num: 10, row: 5, col: 2 },
      { num: 11, row: 6, col: 1 },
      { num: 12, row: 6, col: 6 },
    ],
    // Walls block shortcuts between rows, forcing the snake route
    // None of these walls cross the actual solution path
    walls: [
      { row: 0, col: 1, dir: "bottom" },
      { row: 0, col: 3, dir: "bottom" },
      { row: 0, col: 5, dir: "bottom" },
      { row: 2, col: 2, dir: "bottom" },
      { row: 2, col: 4, dir: "bottom" },
      { row: 3, col: 2, dir: "bottom" },
      { row: 3, col: 4, dir: "bottom" },
      { row: 3, col: 6, dir: "bottom" },
      { row: 4, col: 1, dir: "bottom" },
      { row: 4, col: 3, dir: "bottom" },
      { row: 4, col: 5, dir: "bottom" },
      { row: 5, col: 2, dir: "bottom" },
      { row: 5, col: 4, dir: "bottom" },
    ],
    // Snake path: row 0 L→R, col 6 down, row 1 R→L, col 0 down, row 2 L→R... etc
    path: [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
      [1,6],[1,5],[1,4],[1,3],[1,2],[1,1],[1,0],
      [2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
      [3,6],[3,5],[3,4],[3,3],[3,2],[3,1],[3,0],
      [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],
      [5,6],[5,5],[5,4],[5,3],[5,2],[5,1],[5,0],
      [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],
    ],
  },
};