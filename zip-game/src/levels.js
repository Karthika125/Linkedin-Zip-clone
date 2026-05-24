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
    // Path spirals: down col 0, right row 6, up col 6, left row 0, down col 1,
    // right row 5, up col 5, left row 1, down col 2, then winds to center.
    // Checkpoints placed to MISLEAD — #2 is bottom-left, #5 jumps back to top, #12 ends in center.
    numbers: [
      { num: 1,  row: 0, col: 0 },  // top-left start
      { num: 2,  row: 6, col: 0 },  // bottom-left — forces going DOWN first
      { num: 3,  row: 6, col: 6 },  // bottom-right
      { num: 4,  row: 0, col: 6 },  // top-right — path goes all the way up
      { num: 5,  row: 0, col: 1 },  // back near top-left! very misleading
      { num: 6,  row: 5, col: 1 },  // down the inner col
      { num: 7,  row: 5, col: 5 },  // across to right
      { num: 8,  row: 1, col: 5 },  // back up near top
      { num: 9,  row: 1, col: 2 },  // inner spiral
      { num: 10, row: 4, col: 2 },  // down inner
      { num: 11, row: 3, col: 4 },  // winding toward center
      { num: 12, row: 3, col: 3 },  // dead center — satisfying finish
    ],
    // Walls block the most tempting wrong moves (going right from start, inner shortcuts)
    walls: [
      { row: 0, col: 0, dir: "right" },   // forces going DOWN from #1, not right
      { row: 1, col: 1, dir: "right" },   // blocks inner shortcut
      { row: 2, col: 2, dir: "right" },   // blocks center shortcut
      { row: 3, col: 2, dir: "right" },   // blocks center shortcut
      { row: 1, col: 3, dir: "bottom" },  // blocks vertical inner shortcut
      { row: 3, col: 3, dir: "bottom" },  // blocks path to center from above
      { row: 4, col: 4, dir: "bottom" },  // blocks inner diagonal area
    ],
    // Spiral inward: col0↓, row6→, col6↑, row0←, col1↓, row5→, col5↑, row1←, col2↓, winds to [3,3]
    path: [
      [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
      [6,1],[6,2],[6,3],[6,4],[6,5],[6,6],
      [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
      [0,5],[0,4],[0,3],[0,2],[0,1],
      [1,1],[2,1],[3,1],[4,1],[5,1],
      [5,2],[5,3],[5,4],[5,5],
      [4,5],[3,5],[2,5],[1,5],
      [1,4],[1,3],[1,2],
      [2,2],[3,2],[4,2],
      [4,3],[4,4],
      [3,4],[2,4],[2,3],
      [3,3],
    ],
  },
};