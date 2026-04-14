# Noisy Wordle

## Overview
Noisy Wordle is a variant of the classic Wordle game in which feedback is stochastic rather than deterministic. Each guess returns a corrupted version of the true feedback, introducing uncertainty into the inference process. The objective is to identify the hidden word using sequential guesses and make a final decision once sufficiently confident.

This project serves as an experimental platform for studying decision-making under noisy observations, with connections to information theory and sequential testing.

---

## Game Description

- The target is a 5-letter word sampled from the official Wordle solution set.
- At each step, the player submits a valid guess.
- Feedback is provided in three colors:
  - **Green**: correct letter in correct position  
  - **Yellow**: correct letter in wrong position  
  - **Gray**: letter not in the word  

### Noisy Feedback Model
The observed feedback is a noisy version of the true feedback:
- With probability \(1 - x\), the feedback is correct  
- With probability \(x/2\), it is flipped to each of the other two colors  

This models imperfect information and uncertainty in observations.

---

## Gameplay

- Players can make an arbitrary number of guesses.
- Each guess provides noisy feedback.
- At any point, the player may submit a **Final Guess**.
- The game ends when a final guess is made.

---

## Features

- Interactive Wordle-style interface  
- Realistic Wordle vocabulary (answers + allowed guesses)  
- Noisy feedback mechanism  
- Virtual keyboard with adaptive coloring  
- Unlimited guesses (sequential decision setting)  
- Firebase-based logging of gameplay data  

---

## Data Collection

For each game, the following data is recorded:

- Sequence of guesses  
- Observed feedback (noisy)  
- Final guess and correctness  
- Noise level  
- Time taken  

This enables analysis of:
- decision strategies  
- stopping behavior  
- performance under noise  

---

## Setup

1. Install dependencies:
   ```bash
   npm install

2. Run Locally : 
    ```bash
    npm start

3. Build for production : 
    ```bash
    npm run build

4. Deploy : 
    ```bash
    firebase deploy

## Motivation

This project explores how individuals make decisions under uncertainty. It connects to:

Sequential hypothesis testing under noisy frameworks
Human decision-making under noisy signal