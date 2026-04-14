import { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

import { ANSWERS } from "./wordlists/answers";
import { ALLOWED } from "./wordlists/allowed";

const COLORS = ["#3a3a3c", "#c9b458", "#6aaa64"];

const KEYBOARD = [
  "QWERTYUIOP",
  "ASDFGHJKL",
  "ZXCVBNM"
];

// ---------------- GAME LOGIC ----------------

function getTrueFeedback(guess, target) {
  let fb = Array(5).fill(0);
  let t = target.split("");

  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      fb[i] = 2;
      t[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (fb[i] === 0) {
      let idx = t.indexOf(guess[i]);
      if (idx !== -1) {
        fb[i] = 1;
        t[idx] = null;
      }
    }
  }

  return fb;
}

// 🔥 symmetric noise
function applyNoise(trueFb, noise) {
  return trueFb.map(f => {
    let r = Math.random();

    if (r < 1 - noise) return f;

    let others = [0, 1, 2].filter(x => x !== f);
    return r < 1 - noise + noise / 2 ? others[0] : others[1];
  });
}

// ---------------- APP ----------------

export default function App() {

  const [target] = useState(
    ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
  );

  const [grid, setGrid] = useState([Array(5).fill("")]);
  const [feedbacks, setFeedbacks] = useState([null]);

  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [noise, setNoise] = useState(0.2);
  const [startTime] = useState(Date.now());

  const [error, setError] = useState("");
  const [keyColors, setKeyColors] = useState({});

  // -------- INPUT --------

  const handleKey = (key) => {
    if (gameOver) return;

    if (key === "DEL") {
      if (col > 0) {
        const newGrid = [...grid];
        newGrid[row][col - 1] = "";
        setGrid(newGrid);
        setCol(col - 1);
      }
      return;
    }

    if (key === "ENTER") {
      if (col < 5) return;

      const guess = grid[row].join("").toLowerCase();

      if (!ALLOWED.includes(guess)) {
        setError("Not in word list");
        return;
      }

      setError("");

      const trueFb = getTrueFeedback(guess, target);
      const noisyFb = applyNoise(trueFb, noise);

      const newFeedbacks = [...feedbacks];
      newFeedbacks[row] = noisyFb;
      setFeedbacks(newFeedbacks);

      // 🔥 update keyboard colors
      const newKeyColors = { ...keyColors };
      for (let i = 0; i < 5; i++) {
        const letter = guess[i].toUpperCase();
        const color = noisyFb[i];

        if (!(letter in newKeyColors) || color > newKeyColors[letter]) {
          newKeyColors[letter] = color;
        }
      }
      setKeyColors(newKeyColors);

      // add new row
      setGrid([...grid, Array(5).fill("")]);
      setFeedbacks([...newFeedbacks, null]);

      setRow(row + 1);
      setCol(0);

      return;
    }

    if (/^[A-Z]$/.test(key) && col < 5) {
      const newGrid = [...grid];
      newGrid[row][col] = key;
      setGrid(newGrid);
      setCol(col + 1);
    }
  };

  // -------- PHYSICAL KEYBOARD --------

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") handleKey("ENTER");
      else if (e.key === "Backspace") handleKey("DEL");
      else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKey(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // -------- FINAL GUESS --------

  const handleFinalGuess = async () => {
    const guess = grid[row].join("").toLowerCase();
    if (guess.length !== 5) return;

    const success = guess === target;
    setGameOver(true);

    await addDoc(collection(db, "games"), {
      grid: grid.map(r => r.join("")),
      feedbacks: feedbacks.map(f => f ? f.join("") : null),
      finalGuess: guess,
      success,
      noise,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    });
  };

  // -------- UI --------

  return (
    <div className="app">

      <h1 className="title">Noisy Wordle</h1>

      <div className="slider">
        Noise: {Math.round(noise * 100)}%
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={noise}
          onChange={(e) => setNoise(parseFloat(e.target.value))}
        />
      </div>

      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((c, j) => {
              const fb = feedbacks[i];
              const color = fb ? COLORS[fb[j]] : "#121213";

              return (
                <div key={j} className="tile" style={{ background: color }}>
                  {c}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <button className="final-btn" onClick={handleFinalGuess}>
        Final Guess
      </button>

      <div className="keyboard-wrapper">
        <div className="keyboard">
          {KEYBOARD.map((row, i) => (
            <div key={i}>
              {row.split("").map(k => (
                <button
                  key={k}
                  onClick={() => handleKey(k)}
                  style={{
                    background:
                      keyColors[k] !== undefined
                        ? COLORS[keyColors[k]]
                        : "#818384"
                  }}
                >
                  {k}
                </button>
              ))}
              {i === 2 && (
                <>
                  <button onClick={() => handleKey("DEL")}>DEL</button>
                  <button onClick={() => handleKey("ENTER")}>ENTER</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rules-box">
        <h3>Rules</h3>
        <p>Feedback is noisy: each color may flip.</p>
        <p>Use multiple guesses before committing.</p>
      </div>

      {gameOver && (
        <h2 className="result">
          {grid[row].join("").toLowerCase() === target
            ? "Correct"
            : `Answer: ${target}`}
        </h2>
      )}

    </div>
  );
}