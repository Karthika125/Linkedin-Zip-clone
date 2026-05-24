import React, { useEffect, useRef, useState, useCallback } from "react";
import { levels } from "./levels";

// ─── Audio helpers ──────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq, type = "sine", duration = 0.08, gain = 0.18) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playMove()    { playTone(520, "sine",     0.06, 0.12); }
function playInvalid() { playTone(180, "sawtooth", 0.12, 0.10); }
function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, "sine", 0.22, 0.22), i * 110);
  });
}

function vibrate(ms = 18) {
  try { navigator.vibrate?.(ms); } catch {}
}

// ─── Wall helpers ────────────────────────────────────────────────
// A wall blocks movement between two adjacent cells.
// dir:"right"  → wall on right edge of (row,col), blocks (row,col)↔(row,col+1)
// dir:"bottom" → wall on bottom edge of (row,col), blocks (row,col)↔(row+1,col)
function isWallBetween(walls, a, b) {
  const [r1, c1] = a;
  const [r2, c2] = b;
  return walls.some((w) => {
    if (w.dir === "right") {
      return (
        (w.row === r1 && w.col === c1 && r2 === r1 && c2 === c1 + 1) ||
        (w.row === r2 && w.col === c2 && r1 === r2 && c1 === c2 + 1)
      );
    }
    if (w.dir === "bottom") {
      return (
        (w.row === r1 && w.col === c1 && c2 === c1 && r2 === r1 + 1) ||
        (w.row === r2 && w.col === c2 && c1 === c2 && r1 === r2 + 1)
      );
    }
    return false;
  });
}

// ─── Best time localStorage ──────────────────────────────────────
function getBest(difficulty) {
  const v = localStorage.getItem(`zip_best_${difficulty}`);
  return v ? parseInt(v, 10) : null;
}
function setBest(difficulty, t) {
  const cur = getBest(difficulty);
  if (cur === null || t < cur) {
    localStorage.setItem(`zip_best_${difficulty}`, String(t));
    return true;
  }
  return false;
}

// ─── Main component ──────────────────────────────────────────────
export default function App() {
  const [difficulty, setDifficulty]   = useState("easy");
  const [path, setPath]               = useState([]);
  const [isDragging, setIsDragging]   = useState(false);
  const [timer, setTimer]             = useState(0);
  const [completed, setCompleted]     = useState(false);
  const [isNewBest, setIsNewBest]     = useState(false);
  const [invalidCell, setInvalidCell] = useState(null);
  const [history, setHistory]         = useState([]); // for undo
  const [showHint, setShowHint]       = useState(false);

  const boardRef    = useRef(null);
  const timerRef    = useRef(null);
  const timerValRef = useRef(0); // live timer value, avoids stale closure

  const currentLevel = levels[difficulty];
  const { size, walls = [], path: correctPath, numbers } = currentLevel;

  const CELL_SIZE = size <= 5 ? 64 : size === 6 ? 56 : 48;

  // ── Timer — starts on first move, stops on complete/reset ──────
  const startTimer = useCallback(() => {
    if (timerRef.current) return; // already running
    timerRef.current = setInterval(() => {
      timerValRef.current += 1;
      setTimer(timerValRef.current);
    }, 1000);
  }, []);

  // ── Reset on difficulty change ─────────────────────────────────
  useEffect(() => { resetLevel(); }, [difficulty]);

  const resetLevel = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    timerValRef.current = 0;
    setPath([]);
    setCompleted(false);
    setTimer(0);
    setIsNewBest(false);
    setInvalidCell(null);
    setHistory([]);
    setShowHint(false);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────
  const isSameCell = (a, b) => a[0] === b[0] && a[1] === b[1];

  const isAdjacent = (a, b) => {
    const rd = Math.abs(a[0] - b[0]);
    const cd = Math.abs(a[1] - b[1]);
    return rd + cd === 1;
  };

  const cellInPath = (cell) => path.some((p) => isSameCell(p, cell));

  // ── Check if the numbered checkpoints so far are visited in order ──
  const checkpointOrder = useCallback((newPath) => {
    const sortedNums = [...numbers].sort((a, b) => a.num - b.num);
    let expected = 0;
    for (const cell of newPath) {
      const found = sortedNums[expected];
      if (found && found.row === cell[0] && found.col === cell[1]) {
        expected++;
      } else {
        // Check if this cell is a checkpoint that should come later
        const idx = sortedNums.findIndex(
          (n) => n.row === cell[0] && n.col === cell[1]
        );
        if (idx !== -1 && idx !== expected) return false; // out of order
      }
    }
    return true;
  }, [numbers]);

  // ── Handle entering a cell ─────────────────────────────────────
  const handleCellEnter = useCallback((row, col) => {
    if (!isDragging || completed) return;

    const cell = [row, col];

    if (path.length === 0) {
      const first = numbers.find((n) => n.num === 1);
      if (first && first.row === row && first.col === col) {
        setPath([cell]);
        setHistory([[]]);
        playMove();
      }
      return;
    }

    const last = path[path.length - 1];

    // Backtrack: if stepping onto second-to-last, trim the path
    if (path.length >= 2) {
      const secondLast = path[path.length - 2];
      if (isSameCell(secondLast, cell)) {
        const trimmed = path.slice(0, -1);
        setHistory((h) => [...h, path]);
        setPath(trimmed);
        return;
      }
    }

    if (!isAdjacent(last, cell)) return;
    if (cellInPath(cell)) return;

    // Wall check
    if (isWallBetween(walls, last, cell)) {
      setInvalidCell(cell);
      vibrate(30);
      playInvalid();
      setTimeout(() => setInvalidCell(null), 350);
      return;
    }

    const updated = [...path, cell];

    // Checkpoint order check
    if (!checkpointOrder(updated)) {
      setInvalidCell(cell);
      vibrate(30);
      playInvalid();
      setTimeout(() => setInvalidCell(null), 350);
      return;
    }

    setHistory((h) => [...h, path]);
    setPath(updated);
    playMove();
    vibrate(8);

    // Win check: all cells filled AND all checkpoints visited in order
    const allCheckpointsVisited =
      numbers.every((n) => updated.some((c) => c[0] === n.row && c[1] === n.col));
    const isCorrect =
      updated.length === size * size && allCheckpointsVisited;

    if (isCorrect) {
      setCompleted(true);
      clearInterval(timerRef.current);
      timerRef.current = null;
      const finalTime = timerValRef.current;
      setTimer(finalTime);
      const newBest = setBest(difficulty, finalTime);
      setIsNewBest(newBest);
      playWin();
      vibrate(60);
    }
  }, [isDragging, completed, path, walls, numbers, correctPath, difficulty, timer, checkpointOrder]);

  const startDrag = useCallback((row, col) => {
    if (completed) return;
    setIsDragging(true);
    startTimer();
    const first = numbers.find((n) => n.num === 1);
    if (first && first.row === row && first.col === col) {
      setHistory([[]]);
      setPath([[row, col]]);
      playMove();
    }
  }, [completed, numbers, startTimer]);

  const stopDrag = useCallback(() => setIsDragging(false), []);

  // ── Undo ───────────────────────────────────────────────────────
  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setPath(prev);
    setHistory((h) => h.slice(0, -1));
  };

  // ── Rendering helpers ──────────────────────────────────────────
  const getCheckpoint = (row, col) =>
    numbers.find((n) => n.row === row && n.col === col);

  const isActiveCell = (row, col) =>
    path.some((p) => p[0] === row && p[1] === col);

  const isHintCell = (row, col) =>
    showHint && correctPath.some((p) => p[0] === row && p[1] === col);

  const getPathIndex = (row, col) =>
    path.findIndex((p) => p[0] === row && p[1] === col);

  // ── Wall edge CSS — thick dark bars like real LinkedIn ZIP ──────
  const getWallStyle = (row, col) => {
    const style = {};
    const W = "4px solid #e2e8f0"; // thick light bar on dark bg
    walls.forEach((w) => {
      if (w.dir === "bottom" && w.row === row && w.col === col)
        style.borderBottom = W;
      if (w.dir === "bottom" && w.row === row - 1 && w.col === col)
        style.borderTop = W;
      if (w.dir === "right" && w.row === row && w.col === col)
        style.borderRight = W;
      if (w.dir === "right" && w.row === row && w.col === col - 1)
        style.borderLeft = W;
    });
    return style;
  };

  // ── SVG path ──────────────────────────────────────────────────
  const buildSvgPath = () => {
    if (path.length < 2) return "";
    const pts = path.map(
      ([r, c]) => [c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2]
    );
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i][0]} ${pts[i][1]}`;
    }
    return d;
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  const best = getBest(difficulty);
  const totalCells = size * size;
  const progress = totalCells > 0 ? Math.round((path.length / totalCells) * 100) : 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: "linear-gradient(135deg, #0f0f14 0%, #151520 60%, #0f0f18 100%)" }}
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col items-center pt-8 pb-3 px-4 select-none">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 28 }}>🔗</span>
          <h1
            className="text-white font-black tracking-tight"
            style={{
              fontSize: "clamp(1.6rem, 6vw, 2.4rem)",
              fontFamily: "'DM Serif Display', 'Georgia', serif",
              letterSpacing: "-0.02em",
              textShadow: "0 0 40px #f472b640",
            }}
          >
            ZIP Unlimited
          </h1>
        </div>
        <p style={{ color: "#a78bfa", fontSize: 13, fontFamily: "monospace", letterSpacing: "0.08em" }}>
          for your boyfriend 💜
        </p>
      </div>

      {/* ── DIFFICULTY TABS ── */}
      <div className="flex gap-2 mb-5 px-4">
        {["easy", "medium", "hard"].map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className="capitalize font-semibold transition-all"
            style={{
              padding: "7px 20px",
              borderRadius: 12,
              fontSize: 14,
              border: difficulty === d ? "2px solid #f472b6" : "2px solid #2a2a3a",
              background: difficulty === d
                ? "linear-gradient(135deg,#f472b6,#a855f7)"
                : "#1a1a2a",
              color: difficulty === d ? "#fff" : "#888",
              boxShadow: difficulty === d ? "0 0 18px #f472b640" : "none",
              transform: difficulty === d ? "scale(1.04)" : "scale(1)",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* ── STATS BAR ── */}
      <div
        className="flex items-center gap-5 mb-4"
        style={{
          background: "#1a1a2a",
          border: "1px solid #2a2a3a",
          borderRadius: 16,
          padding: "10px 24px",
          minWidth: 260,
          justifyContent: "center",
        }}
      >
        <div className="flex flex-col items-center">
          <span style={{ color: "#666", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Time</span>
          <span style={{ color: "#f472b6", fontWeight: 700, fontSize: 22, fontFamily: "monospace" }}>
            {formatTime(timer)}
          </span>
        </div>
        <div style={{ width: 1, height: 32, background: "#2a2a3a" }} />
        <div className="flex flex-col items-center">
          <span style={{ color: "#666", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Best</span>
          <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 22, fontFamily: "monospace" }}>
            {best ? formatTime(best) : "—"}
          </span>
        </div>
        <div style={{ width: 1, height: 32, background: "#2a2a3a" }} />
        <div className="flex flex-col items-center">
          <span style={{ color: "#666", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Fill</span>
          <span style={{ color: "#34d399", fontWeight: 700, fontSize: 22, fontFamily: "monospace" }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* ── BOARD ── */}
      <div
        ref={boardRef}
        className="relative select-none"
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchEnd={stopDrag}
        style={{
          width: size * CELL_SIZE,
          height: size * CELL_SIZE,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 0 60px #f472b620, 0 8px 40px #00000060",
          border: "2px solid #2a2a3a",
          touchAction: "none",
        }}
      >
        {/* SVG path layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size * CELL_SIZE}
          height={size * CELL_SIZE}
          style={{ zIndex: 2 }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Glow trail */}
          {path.length >= 2 && (
            <path
              d={buildSvgPath()}
              fill="none"
              stroke="#f472b6"
              strokeWidth={CELL_SIZE * 0.48}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.15"
              filter="url(#glow)"
            />
          )}
          {/* Main path */}
          {path.length >= 2 && (
            <path
              d={buildSvgPath()}
              fill="none"
              stroke="#f472b6"
              strokeWidth={CELL_SIZE * 0.36}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              style={{ transition: "d 0.05s ease" }}
            />
          )}
        </svg>

        {/* GRID */}
        <div
          className="absolute inset-0"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, ${CELL_SIZE}px)`,
            zIndex: 1,
          }}
        >
          {Array.from({ length: size }).map((_, row) =>
            Array.from({ length: size }).map((_, col) => {
              const checkpoint = getCheckpoint(row, col);
              const active = isActiveCell(row, col);
              const hint = isHintCell(row, col);
              const isInvalid = invalidCell && invalidCell[0] === row && invalidCell[1] === col;
              const wallStyle = getWallStyle(row, col);

              return (
                <div
                  key={`${row}-${col}`}
                  onMouseDown={() => startDrag(row, col)}
                  onMouseEnter={() => handleCellEnter(row, col)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startDrag(row, col);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = boardRef.current.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;
                    const newCol = Math.floor(x / CELL_SIZE);
                    const newRow = Math.floor(y / CELL_SIZE);
                    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                      handleCellEnter(newRow, newCol);
                    }
                  }}
                  className="relative"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: isInvalid
                      ? "#ff3366"
                      : active
                      ? "#1e0e24"
                      : hint
                      ? "#151525"
                      : "#141420",
                    border: "1px solid #1e1e2e",
                    boxSizing: "border-box",
                    transition: "background 0.12s",
                    cursor: "crosshair",
                    ...wallStyle,
                  }}
                >
                  {/* Hint dot */}
                  {hint && !active && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#a78bfa40",
                        }}
                      />
                    </div>
                  )}

                  {/* Checkpoint badge */}
                  {checkpoint && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 3,
                      }}
                    >
                      <div
                        style={{
                          width: CELL_SIZE * 0.62,
                          height: CELL_SIZE * 0.62,
                          borderRadius: "50%",
                          background: active
                            ? "linear-gradient(135deg, #f472b6, #a855f7)"
                            : "linear-gradient(135deg, #2a1a3a, #1a1a2e)",
                          border: active ? "2px solid #fff3" : "2px solid #f472b650",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: active
                            ? "0 0 16px #f472b660"
                            : "0 0 8px #f472b620",
                          transition: "all 0.2s ease",
                          transform: active ? "scale(1.08)" : "scale(1)",
                        }}
                      >
                        <span
                          style={{
                            color: active ? "#fff" : "#f472b6",
                            fontWeight: 800,
                            fontSize: CELL_SIZE * 0.24,
                            fontFamily: "monospace",
                            lineHeight: 1,
                          }}
                        >
                          {checkpoint.num}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div
        style={{
          width: size * CELL_SIZE,
          height: 4,
          background: "#1a1a2a",
          borderRadius: 4,
          marginTop: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #f472b6, #a855f7)",
            borderRadius: 4,
            transition: "width 0.2s ease",
          }}
        />
      </div>

      {/* ── BUTTONS ── */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={resetLevel}
          style={{
            background: "#1a1a2a",
            border: "1px solid #2a2a3a",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.borderColor = "#f472b6")}
          onMouseLeave={(e) => (e.target.style.borderColor = "#2a2a3a")}
        >
          ↺ Reset
        </button>

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          style={{
            background: "#1a1a2a",
            border: "1px solid #2a2a3a",
            color: history.length === 0 ? "#444" : "#fff",
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: history.length === 0 ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (history.length > 0) e.target.style.borderColor = "#a78bfa"; }}
          onMouseLeave={(e) => (e.target.style.borderColor = "#2a2a3a")}
        >
          ↩ Undo
        </button>

        <button
          onClick={() => setShowHint((h) => !h)}
          style={{
            background: showHint ? "#1a0e2a" : "#1a1a2a",
            border: `1px solid ${showHint ? "#a78bfa" : "#2a2a3a"}`,
            color: showHint ? "#a78bfa" : "#888",
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          💡 Hint
        </button>
      </div>

      {/* ── WIN STATE ── */}
      {completed && (
        <div
          className="mt-6 text-center px-4"
          style={{
            background: "linear-gradient(135deg, #1e0a2e, #0e0e1e)",
            border: "1px solid #f472b650",
            borderRadius: 20,
            padding: "24px 36px",
            boxShadow: "0 0 60px #f472b630",
            animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <h2
            style={{
              color: "#fff",
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 26,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Puzzle Complete!
          </h2>
          <p style={{ color: "#f472b6", fontSize: 15, marginBottom: 8 }}>
            Time: <strong>{formatTime(timer)}</strong>
            {isNewBest && (
              <span
                style={{
                  marginLeft: 10,
                  background: "linear-gradient(135deg,#f472b6,#a855f7)",
                  borderRadius: 8,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                🏆 NEW BEST
              </span>
            )}
          </p>
          <p style={{ color: "#888", fontSize: 13 }}>
            He officially has unlimited ZIP 💜
          </p>
          <button
            onClick={resetLevel}
            style={{
              marginTop: 16,
              background: "linear-gradient(135deg,#f472b6,#a855f7)",
              border: "none",
              color: "#fff",
              padding: "10px 28px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px #f472b640",
            }}
          >
            Play Again
          </button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        * { -webkit-tap-highlight-color: transparent; user-select: none; }
        body { background: #0f0f14; }
      `}</style>

      <div style={{ height: 40 }} />
    </div>
  );
}