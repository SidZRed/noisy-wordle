import { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const WORDS = ["apple", "grape", "crane", "flame", "brick"];
const COLORS = ["#3a3a3c", "#c9b458", "#6aaa64"];

const KEYBOARD = [
  "QWERTYUIOP",
  "ASDFGHJKL",
  "ZXCVBNM"
];

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

// 🔥 Correct noise model
function applyNoise(trueFb, noiseLevel) {
  return trueFb.map(f => {
    let r = Math.random();

    if (f === 2) {
      if (r < noiseLevel / 2) return 1;
      if (r < noiseLevel) return 0;
      return 2;
    }

    if (f === 1) {
      if (r < noiseLevel) return 0;
      return 1;
    }

    return 0;
  });
}

export default function App() {

  const [target] = useState(WORDS[Math.floor(Math.random()*WORDS.length)]);

  // 🔥 Dynamic grid
  const [grid, setGrid] = useState([Array(5).fill("")]);
  const [feedbacks, setFeedbacks] = useState([null]);

  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [noise, setNoise] = useState(0.2);
  const [startTime] = useState(Date.now());

  // ----------- INPUT -----------

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

      const guess = grid[row].join("");
      const trueFb = getTrueFeedback(guess, target);
      const noisyFb = applyNoise(trueFb, noise);

      const newFeedbacks = [...feedbacks];
      newFeedbacks[row] = noisyFb;

      const newGrid = [...grid, Array(5).fill("")];
      const newFb = [...newFeedbacks, null];

      setGrid(newGrid);
      setFeedbacks(newFb);

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

  // ----------- KEYBOARD -----------

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

  // ----------- FINAL GUESS -----------

  const handleFinalGuess = async () => {
    const guess = grid[row].join("");
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

  // ----------- UI -----------

  return (
    <div className="app">

      <h1>Noisy Wordle</h1>

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

      <button className="final-btn" onClick={handleFinalGuess}>
        Final Guess
      </button>

      <div className="keyboard">
        {KEYBOARD.map((row, i) => (
          <div key={i}>
            {row.split("").map(k => (
              <button key={k} onClick={() => handleKey(k)}>
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

      <div className="rules-box">
        <h3>Rules</h3>
        <p>Noisy Feedback :</p>
        <p>Green → may become Yellow/Black</p>
        <p>Yellow → may become Black</p>
        <p>Click Final Guess when confident.</p>
      </div>

      {gameOver && (
        <h2>{grid[row].join("") === target ? "Correct!" : `Word was ${target}`}</h2>
      )}

    </div>
  );
}