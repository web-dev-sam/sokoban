# Soko Deutsche Bahn

A modern, minimalistic Sokoban puzzle game built with Vue 3 and TypeScript.

![Sokoban Game](https://github.com/user/soko-deutsche-bahn/raw/main/public/screenshot.png)

## Features

- **500+ Levels**: A vast collection of puzzles ranging from beginner-friendly to advanced challenges
- **Multiple Level Collections**: Includes levels from various authors including Beginner, Original, DrFogh, Thinking Rabbit, and Howard Abed collections
- **Local Highscores**: Track your best performance (moves and time) for each level
- **Modern UI**: Clean, minimalistic interface that focuses on the gameplay experience
- **Solver Algorithms**: Includes multiple solving algorithms (IDA*, A*, BFS, DFS, UCS) for development and testing
- **No Mobile Support** (yet): For now I didn't add mobile support intentionally, to keep it minimalistic.

## How to Play

### Controls

- **Arrow Keys** or **WASD**: Move the player
- **R**: Restart the current level
- **U**: Undo the last move
- **L**: Open the level selector
- **N** or **Enter**: Go to the next level (after completing a level)
- **Escape**: Close the level selector

### Game Rules

1. Push all boxes (orange squares) onto the target spots (yellow dots)
2. Boxes turn green when placed on a target
3. Complete the level with the fewest moves and in the shortest time possible
4. Be careful not to push boxes into corners or positions where they can't be moved anymore

## Development

### Project Setup

```bash
pnpm i
pnpm dev
```

### Technologies Used

- Vue 3 with Composition API
- TypeScript
- TailwindCSS
- VueUse

## Level Collections

The game includes several level collections:

- **Beginner**: Simple levels to learn the game mechanics
- **Beginner 2**: Slightly more challenging beginner levels
- **Original**: Classic Sokoban levels
- **DrFogh**: Levels created by DrFogh
- **Thinking Rabbit**: Levels from the original Sokoban creators
- **Howard Abed**: Challenging levels by Howard Abed

