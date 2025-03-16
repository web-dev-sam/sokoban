import { CELL, findPlayerInLevel, isPosOutOfBounds } from "./utils";
import type { Level, LevelPosition } from "./utils";

// Define directions for movement
const DIRECTIONS = [
  { dx: 0, dy: -1, name: "UP" },    // Up
  { dx: 1, dy: 0, name: "RIGHT" },  // Right
  { dx: 0, dy: 1, name: "DOWN" },   // Down
  { dx: -1, dy: 0, name: "LEFT" }   // Left
];

// Compact state representation for Sokoban
interface CompactState {
  playerPos: LevelPosition;
  boxPositions: Set<string>; // Using "x,y" strings for positions
  moves: string[];
  pushes: number;
  steps: number;
}

// Zobrist hashing constants
const ZOBRIST_PLAYER = new Map<string, number>();
const ZOBRIST_BOX = new Map<string, number>();
let LEVEL_WIDTH = 0;
let LEVEL_HEIGHT = 0;
let WALLS: boolean[][] = [];
let TARGETS: Set<string> = new Set();

// Initialize Zobrist hashing tables
function initZobrist(level: Level): void {
  LEVEL_WIDTH = level[0].length;
  LEVEL_HEIGHT = level.length;
  WALLS = Array(LEVEL_HEIGHT).fill(0).map(() => Array(LEVEL_WIDTH).fill(false));
  TARGETS = new Set();
  
  // Initialize random values for each position
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_WIDTH; x++) {
      const pos = `${x},${y}`;
      ZOBRIST_PLAYER.set(pos, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
      ZOBRIST_BOX.set(pos, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
      
      // Record walls and targets
      if (level[y][x] === CELL.WALL) {
        WALLS[y][x] = true;
      }
      if (level[y][x] === CELL.TARGET || level[y][x] === CELL.BOX_ON_TARGET || level[y][x] === CELL.PLAYER_ON_TARGET) {
        TARGETS.add(pos);
      }
    }
  }
}

// Convert level to compact state
function levelToCompactState(level: Level): CompactState {
  const playerPos = findPlayerInLevel(level)!;
  const boxPositions = new Set<string>();
  
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      if (level[y][x] === CELL.BOX || level[y][x] === CELL.BOX_ON_TARGET) {
        boxPositions.add(`${x},${y}`);
      }
    }
  }
  
  return {
    playerPos,
    boxPositions,
    moves: [],
    pushes: 0,
    steps: 0
  };
}

// Hash a compact state using Zobrist hashing
function hashCompactState(state: CompactState): number {
  let hash = 0;
  
  // Hash player position
  const playerPosStr = `${state.playerPos.x},${state.playerPos.y}`;
  hash ^= ZOBRIST_PLAYER.get(playerPosStr) || 0;
  
  // Hash box positions
  for (const boxPos of state.boxPositions) {
    hash ^= ZOBRIST_BOX.get(boxPos) || 0;
  }
  
  return hash;
}

// Check if a position is a corner deadlock
function isCornerDeadlock(x: number, y: number): boolean {
  // Skip if position is a target
  if (TARGETS.has(`${x},${y}`)) return false;
  
  // Check for corner deadlocks (box trapped in corner)
  const horizontalWall = (WALLS[y-1]?.[x] || false) || (WALLS[y+1]?.[x] || false);
  const verticalWall = (WALLS[y]?.[x-1] || false) || (WALLS[y]?.[x+1] || false);
  
  return horizontalWall && verticalWall;
}

// Check if a box is in a deadlock position
function isDeadlock(boxPositions: Set<string>): boolean {
  for (const boxPos of boxPositions) {
    const [x, y] = boxPos.split(',').map(Number);
    
    // Check for corner deadlocks
    if (isCornerDeadlock(x, y)) {
      return true;
    }
  }
  
  return false;
}

// Calculate a more sophisticated heuristic
function calculateHeuristic(boxPositions: Set<string>): number {
  let totalDistance = 0;
  const boxesArray: LevelPosition[] = [];
  const targetsArray: LevelPosition[] = [];
  
  // Convert box positions to array
  for (const boxPos of boxPositions) {
    const [x, y] = boxPos.split(',').map(Number);
    boxesArray.push({ x, y });
  }
  
  // Convert target positions to array
  for (const targetPos of TARGETS) {
    const [x, y] = targetPos.split(',').map(Number);
    targetsArray.push({ x, y });
  }
  
  // Calculate minimum matching distance using a greedy approach
  // This is not optimal but much faster than the Hungarian algorithm
  const remainingTargets = [...targetsArray];
  
  for (const box of boxesArray) {
    let minDistance = Number.MAX_SAFE_INTEGER;
    let bestTargetIndex = -1;
    
    for (let i = 0; i < remainingTargets.length; i++) {
      const target = remainingTargets[i];
      const distance = manhattanDistance(box, target);
      
      if (distance < minDistance) {
        minDistance = distance;
        bestTargetIndex = i;
      }
    }
    
    if (bestTargetIndex !== -1) {
      totalDistance += minDistance;
      remainingTargets.splice(bestTargetIndex, 1);
    }
  }
  
  return totalDistance;
}

// Calculate Manhattan distance between two positions
function manhattanDistance(pos1: LevelPosition, pos2: LevelPosition): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

// Check if all boxes are on targets
function isGoalState(boxPositions: Set<string>): boolean {
  if (boxPositions.size !== TARGETS.size) return false;
  
  for (const boxPos of boxPositions) {
    if (!TARGETS.has(boxPos)) {
      return false;
    }
  }
  
  return true;
}

// IDA* search algorithm
export function solveIDA(level: Level): { moves: string[] } | null {
  // Initialize Zobrist hashing tables
  initZobrist(level);
  
  // Convert level to compact state
  const initialState = levelToCompactState(level);
  
  // Initial threshold is the heuristic value of the initial state
  let threshold = calculateHeuristic(initialState.boxPositions);
  
  // Maximum iterations to prevent infinite loops
  const MAX_ITERATIONS = 50;
  let iterations = 0;
  
  while (iterations < MAX_ITERATIONS) {
    const result = search(initialState, 0, threshold, new Set<number>(), level);
    
    if (result.found) {
      return { moves: result.state!.moves };
    }
    
    if (result.nextThreshold === Infinity) {
      return null; // No solution found
    }
    
    threshold = result.nextThreshold;
    iterations++;
  }
  
  return null; // No solution found within iteration limit
}

// DFS with iterative deepening
function search(
  state: CompactState,
  g: number,
  threshold: number,
  visited: Set<number>,
  level: Level
): { found: boolean; nextThreshold: number; state?: CompactState } {
  const f = g + calculateHeuristic(state.boxPositions);
  
  if (f > threshold) {
    return { found: false, nextThreshold: f };
  }
  
  if (isGoalState(state.boxPositions)) {
    return { found: true, nextThreshold: 0, state };
  }
  
  // Add current state to visited set
  const stateHash = hashCompactState(state);
  if (visited.has(stateHash)) {
    return { found: false, nextThreshold: Infinity };
  }
  visited.add(stateHash);
  
  let minThreshold = Infinity;
  
  // Try each direction
  for (const direction of DIRECTIONS) {
    const { dx, dy, name } = direction;
    const newPlayerPos = {
      x: state.playerPos.x + dx,
      y: state.playerPos.y + dy
    };
    
    // Check if the new position is valid (not a wall)
    if (WALLS[newPlayerPos.y]?.[newPlayerPos.x]) {
      continue;
    }
    
    // Create a new state
    const newBoxPositions = new Set(state.boxPositions);
    let isPush = false;
    
    // Check if the player is pushing a box
    const newPlayerPosStr = `${newPlayerPos.x},${newPlayerPos.y}`;
    if (newBoxPositions.has(newPlayerPosStr)) {
      // Calculate the position behind the box
      const behindBoxPos = {
        x: newPlayerPos.x + dx,
        y: newPlayerPos.y + dy
      };
      
      // Check if the position behind the box is valid
      if (isPosOutOfBounds(level, behindBoxPos.x, behindBoxPos.y) || 
          WALLS[behindBoxPos.y]?.[behindBoxPos.x] ||
          newBoxPositions.has(`${behindBoxPos.x},${behindBoxPos.y}`)) {
        continue;
      }
      
      // Move the box
      newBoxPositions.delete(newPlayerPosStr);
      newBoxPositions.add(`${behindBoxPos.x},${behindBoxPos.y}`);
      
      // Check for deadlocks
      if (isDeadlock(newBoxPositions)) {
        continue;
      }
      
      isPush = true;
    }
    
    // Create new state
    const newState: CompactState = {
      playerPos: newPlayerPos,
      boxPositions: newBoxPositions,
      moves: [...state.moves, name],
      pushes: state.pushes + (isPush ? 1 : 0),
      steps: state.steps + 1
    };
    
    // Recursively search from the new state
    const result = search(newState, g + 1 + (isPush ? 1 : 0), threshold, new Set(visited), level);
    
    if (result.found) {
      return result;
    }
    
    minThreshold = Math.min(minThreshold, result.nextThreshold);
  }
  
  // Remove current state from visited set before backtracking
  visited.delete(stateHash);
  
  return { found: false, nextThreshold: minThreshold };
}

// Main solver function
export function solve(method: "ida" | "astar" | "bfs" | "dfs" | "ucs", level: Level) {
  switch (method) {
    case "ida": return solveIDA(level);
    // You can add other methods here if needed
    default: 
      console.error(`Method ${method} not implemented in optimized solver`);
      return null;
  }
}
