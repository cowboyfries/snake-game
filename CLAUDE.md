# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

Commit and push to GitHub regularly throughout any work session — after each meaningful change, not just at the end. Use clear, specific commit messages describing what changed and why. This ensures work is never lost and progress is always recoverable.

## Project Overview

This is a single-file browser Snake game (`snake.html`). Open the file directly in any modern browser to play — no build step, server, or dependencies required.

## Architecture

Everything lives in `snake.html` as a self-contained file with three sections:

- **CSS** (`<style>`): Dark-themed UI with teal (`#4ecca3`) accent color on a dark blue (`#1a1a2e`) background.
- **HTML**: A `<canvas id="canvas">` (480×480px, 24×24 grid) plus scoreboard and message elements.
- **JavaScript** (`<script>`): All game logic inline at the bottom of the file.

### Game Logic

| Concept | Details |
|---|---|
| Grid | 24×24 cells, each 20px (`CELL = canvas.width / COLS`) |
| Game loop | `setInterval(tick, ms)` — starts at 120ms, speeds up by `max(60, 120 - score*3)` every 5 points |
| State machine | `gameState`: `'idle'` → `'running'` → `'over'` |
| Persistence | High score saved to `localStorage` under key `snakeBest` |
| Controls | Arrow keys or WASD to steer; Space/Enter to start/restart |

### Key Functions

- `initGame()` — resets snake, score, food, starts the interval
- `tick()` — advances the snake, checks collisions, handles food pickup and speed scaling
- `draw()` — full canvas redraw each tick: grid lines, food (circle with shine), snake (gradient-colored rounded rects), directional eyes on head, game-over overlay
- `placeFood()` — random position avoiding snake body
- `endGame()` — clears interval, sets state, triggers game-over draw and message
