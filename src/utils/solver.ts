import { CELL, deepCopy, findPlayerInLevel, isLevelDone, isPosOutOfBounds } from "./utils";
import type { Level, LevelPosition } from "./utils";
import { solveIDA } from "./optimizedSolver";

// Define directions for movement
const DIRECTIONS = [
  { dx: 0, dy: -1, name: "UP" },    // Up
  { dx: 1, dy: 0, name: "RIGHT" },  // Right
  { dx: 0, dy: 1, name: "DOWN" },   // Down
  { dx: -1, dy: 0, name: "LEFT" }   // Left
];

// Define a state for the A* algorithm
interface SokobanState {
  level: Level;
  playerPos: LevelPosition;
  moves: string[];
  pushes: number;
  steps: number;
}

// Define a node for the A* algorithm
interface Node {
  state: SokobanState;
  gScore: number;  // Cost from start to current node
  fScore: number;  // gScore + heuristic
  parent: Node | null;
}

export function solve(method: "ida" | "astar" | "bfs" | "dfs" | "ucs", level: Level) {
  switch (method) {
    case "ida": return solveIDA(level);
    case "astar": return solveAStar(level);
    case "bfs": return solveBFS(level);
    case "dfs": return solveDFS(level);
    case "ucs": return solveUCS(level);
  }
}

function solveUCS(level: Level): { moves: string[] } | null {
  // Create a hash for a state to check for duplicates
  function hashState(state: SokobanState): string {
    // We only care about the level layout and player position for the hash
    return JSON.stringify({
      level: state.level,
      playerPos: state.playerPos
    });
  }

  const initialLevel = deepCopy(level);
  const playerPos = findPlayerInLevel(initialLevel);
  
  if (!playerPos) {
    console.error("No player found in the level");
    return null;
  }
  
  // Create initial state
  const initialState: SokobanState = {
    level: initialLevel,
    playerPos,
    moves: [],
    pushes: 0,
    steps: 0
  };
  
  // Define a node for UCS
  interface UCSNode {
    state: SokobanState;
    cost: number;  // Path cost from start to this node
  }
  
  // Create initial node
  const startNode: UCSNode = {
    state: initialState,
    cost: 0
  };
  
  // Priority queue for UCS (sorted by cost)
  const queue: UCSNode[] = [startNode];
  
  // Map to keep track of visited states and their costs
  const visited = new Map<string, number>();
  visited.set(hashState(initialState), 0);
  
  while (queue.length > 0) {
    // Sort the queue by cost and get the node with the lowest cost
    queue.sort((a, b) => a.cost - b.cost);
    const currentNode = queue.shift()!;
    
    // Check if the level is solved
    if (isLevelDone(currentNode.state.level)) {
      // Return the moves that led to the solution
      return {
        moves: currentNode.state.moves
      };
    }
    
    // Explore all possible moves
    for (const direction of DIRECTIONS) {
      const { dx, dy, name } = direction;
      const newPlayerPos = {
        x: currentNode.state.playerPos.x + dx,
        y: currentNode.state.playerPos.y + dy
      };
      
      // Check if the new position is valid
      if (isPosOutOfBounds(currentNode.state.level, newPlayerPos.x, newPlayerPos.y)) {
        continue;
      }
      
      const newLevel = deepCopy(currentNode.state.level);
      const currentCell = newLevel[currentNode.state.playerPos.y][currentNode.state.playerPos.x];
      const targetCell = newLevel[newPlayerPos.y][newPlayerPos.x];
      
      // Check if the target cell is a wall
      if (targetCell === CELL.WALL) {
        continue;
      }
      
      let isPush = false;
      
      // Check if the target cell is a box or a box on target
      if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
        // Calculate the position behind the box
        const behindBoxPos = {
          x: newPlayerPos.x + dx,
          y: newPlayerPos.y + dy
        };
        
        // Check if the position behind the box is valid
        if (isPosOutOfBounds(newLevel, behindBoxPos.x, behindBoxPos.y)) {
          continue;
        }
        
        const behindBoxCell = newLevel[behindBoxPos.y][behindBoxPos.x];
        
        // Check if the position behind the box is free
        if (behindBoxCell !== CELL.SPACE && behindBoxCell !== CELL.TARGET) {
          continue;
        }
        
        // Move the box
        if (behindBoxCell === CELL.SPACE) {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX;
        } else {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX_ON_TARGET;
        }
        
        isPush = true;
      }
      
      // Update the target cell
      if (targetCell === CELL.SPACE || targetCell === CELL.BOX) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER;
      } else if (targetCell === CELL.TARGET || targetCell === CELL.BOX_ON_TARGET) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER_ON_TARGET;
      }
      
      // Update the current cell
      if (currentCell === CELL.PLAYER) {
        newLevel[currentNode.state.playerPos.y][currentNode.state.playerPos.x] = CELL.SPACE;
      } else if (currentCell === CELL.PLAYER_ON_TARGET) {
        newLevel[currentNode.state.playerPos.y][currentNode.state.playerPos.x] = CELL.TARGET;
      }
      
      // Create new state
      const newState: SokobanState = {
        level: newLevel,
        playerPos: newPlayerPos,
        moves: [...currentNode.state.moves, name],
        pushes: currentNode.state.pushes + (isPush ? 1 : 0),
        steps: currentNode.state.steps + 1
      };
      
      // Calculate the cost of the new state
      // We'll use steps + pushes as the cost, with pushes having a higher weight
      const moveCost = 1;  // Cost of a regular move
      const pushCost = 2;  // Cost of pushing a box (higher than a regular move)
      const newCost = currentNode.cost + moveCost + (isPush ? pushCost : 0);
      
      // Check if we've already visited this state with a lower cost
      const newStateHash = hashState(newState);
      const existingCost = visited.get(newStateHash);
      
      if (existingCost === undefined || newCost < existingCost) {
        // Update the visited map with the new cost
        visited.set(newStateHash, newCost);
        
        // Add the new node to the queue
        queue.push({
          state: newState,
          cost: newCost
        });
      }
    }
  }
  
  // No solution found
  return null;
}


function solveDFS(level: Level): { moves: string[] } | null {
  // Create a hash for a state to check for duplicates
  function hashState(state: SokobanState): string {
    // We only care about the level layout and player position for the hash
    return JSON.stringify({
      level: state.level,
      playerPos: state.playerPos
    });
  }

  const initialLevel = deepCopy(level);
  const playerPos = findPlayerInLevel(initialLevel);
  
  if (!playerPos) {
    console.error("No player found in the level");
    return null;
  }
  
  // Create initial state
  const initialState: SokobanState = {
    level: initialLevel,
    playerPos,
    moves: [],
    pushes: 0,
    steps: 0
  };
  
  // Stack for DFS (Last In, First Out)
  const stack: SokobanState[] = [initialState];
  
  // Set to keep track of visited states
  const visited = new Set<string>();
  visited.add(hashState(initialState));
  
  while (stack.length > 0) {
    // Get the next state from the stack (LIFO)
    const currentState = stack.pop()!;
    
    // Check if the level is solved
    if (isLevelDone(currentState.level)) {
      // Return the moves that led to the solution
      return {
        moves: currentState.moves
      };
    }
    
    // Explore all possible moves (in reverse order to prioritize UP, RIGHT, DOWN, LEFT)
    for (let i = DIRECTIONS.length - 1; i >= 0; i--) {
      const direction = DIRECTIONS[i];
      const { dx, dy, name } = direction;
      const newPlayerPos = {
        x: currentState.playerPos.x + dx,
        y: currentState.playerPos.y + dy
      };
      
      // Check if the new position is valid
      if (isPosOutOfBounds(currentState.level, newPlayerPos.x, newPlayerPos.y)) {
        continue;
      }
      
      const newLevel = deepCopy(currentState.level);
      const currentCell = newLevel[currentState.playerPos.y][currentState.playerPos.x];
      const targetCell = newLevel[newPlayerPos.y][newPlayerPos.x];
      
      // Check if the target cell is a wall
      if (targetCell === CELL.WALL) {
        continue;
      }
      
      let isPush = false;
      
      // Check if the target cell is a box or a box on target
      if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
        // Calculate the position behind the box
        const behindBoxPos = {
          x: newPlayerPos.x + dx,
          y: newPlayerPos.y + dy
        };
        
        // Check if the position behind the box is valid
        if (isPosOutOfBounds(newLevel, behindBoxPos.x, behindBoxPos.y)) {
          continue;
        }
        
        const behindBoxCell = newLevel[behindBoxPos.y][behindBoxPos.x];
        
        // Check if the position behind the box is free
        if (behindBoxCell !== CELL.SPACE && behindBoxCell !== CELL.TARGET) {
          continue;
        }
        
        // Move the box
        if (behindBoxCell === CELL.SPACE) {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX;
        } else {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX_ON_TARGET;
        }
        
        isPush = true;
      }
      
      // Update the target cell
      if (targetCell === CELL.SPACE || targetCell === CELL.BOX) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER;
      } else if (targetCell === CELL.TARGET || targetCell === CELL.BOX_ON_TARGET) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER_ON_TARGET;
      }
      
      // Update the current cell
      if (currentCell === CELL.PLAYER) {
        newLevel[currentState.playerPos.y][currentState.playerPos.x] = CELL.SPACE;
      } else if (currentCell === CELL.PLAYER_ON_TARGET) {
        newLevel[currentState.playerPos.y][currentState.playerPos.x] = CELL.TARGET;
      }
      
      // Create new state
      const newState: SokobanState = {
        level: newLevel,
        playerPos: newPlayerPos,
        moves: [...currentState.moves, name],
        pushes: currentState.pushes + (isPush ? 1 : 0),
        steps: currentState.steps + 1
      };
      
      // Check if we've already visited this state
      const newStateHash = hashState(newState);
      if (!visited.has(newStateHash)) {
        visited.add(newStateHash);
        stack.push(newState);
      }
    }
  }
  
  // No solution found
  return null;
}

function solveBFS(level: Level): { moves: string[] } | null {
  // Create a hash for a state to check for duplicates
  function hashState(state: SokobanState): string {
    // We only care about the level layout and player position for the hash
    return JSON.stringify({
      level: state.level,
      playerPos: state.playerPos
    });
  }

  const initialLevel = deepCopy(level);
  const playerPos = findPlayerInLevel(initialLevel);
  
  if (!playerPos) {
    console.error("No player found in the level");
    return null;
  }
  
  // Create initial state
  const initialState: SokobanState = {
    level: initialLevel,
    playerPos,
    moves: [],
    pushes: 0,
    steps: 0
  };
  
  // Queue for BFS
  const queue: SokobanState[] = [initialState];
  
  // Set to keep track of visited states
  const visited = new Set<string>();
  visited.add(hashState(initialState));
  
  while (queue.length > 0) {
    // Get the next state from the queue (FIFO)
    const currentState = queue.shift()!;
    
    // Check if the level is solved
    if (isLevelDone(currentState.level)) {
      // Return the moves that led to the solution
      return {
        moves: currentState.moves
      };
    }
    
    // Explore all possible moves
    for (const direction of DIRECTIONS) {
      const { dx, dy, name } = direction;
      const newPlayerPos = {
        x: currentState.playerPos.x + dx,
        y: currentState.playerPos.y + dy
      };
      
      // Check if the new position is valid
      if (isPosOutOfBounds(currentState.level, newPlayerPos.x, newPlayerPos.y)) {
        continue;
      }
      
      const newLevel = deepCopy(currentState.level);
      const currentCell = newLevel[currentState.playerPos.y][currentState.playerPos.x];
      const targetCell = newLevel[newPlayerPos.y][newPlayerPos.x];
      
      // Check if the target cell is a wall
      if (targetCell === CELL.WALL) {
        continue;
      }
      
      let isPush = false;
      
      // Check if the target cell is a box or a box on target
      if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
        // Calculate the position behind the box
        const behindBoxPos = {
          x: newPlayerPos.x + dx,
          y: newPlayerPos.y + dy
        };
        
        // Check if the position behind the box is valid
        if (isPosOutOfBounds(newLevel, behindBoxPos.x, behindBoxPos.y)) {
          continue;
        }
        
        const behindBoxCell = newLevel[behindBoxPos.y][behindBoxPos.x];
        
        // Check if the position behind the box is free
        if (behindBoxCell !== CELL.SPACE && behindBoxCell !== CELL.TARGET) {
          continue;
        }
        
        // Move the box
        if (behindBoxCell === CELL.SPACE) {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX;
        } else {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX_ON_TARGET;
        }
        
        isPush = true;
      }
      
      // Update the target cell
      if (targetCell === CELL.SPACE || targetCell === CELL.BOX) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER;
      } else if (targetCell === CELL.TARGET || targetCell === CELL.BOX_ON_TARGET) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER_ON_TARGET;
      }
      
      // Update the current cell
      if (currentCell === CELL.PLAYER) {
        newLevel[currentState.playerPos.y][currentState.playerPos.x] = CELL.SPACE;
      } else if (currentCell === CELL.PLAYER_ON_TARGET) {
        newLevel[currentState.playerPos.y][currentState.playerPos.x] = CELL.TARGET;
      }
      
      // Create new state
      const newState: SokobanState = {
        level: newLevel,
        playerPos: newPlayerPos,
        moves: [...currentState.moves, name],
        pushes: currentState.pushes + (isPush ? 1 : 0),
        steps: currentState.steps + 1
      };
      
      // Check if we've already visited this state
      const newStateHash = hashState(newState);
      if (!visited.has(newStateHash)) {
        visited.add(newStateHash);
        queue.push(newState);
      }
    }
  }
  
  // No solution found
  return null;
}

function solveAStar(level: Level): { moves: string[] } | null {

  // Calculate heuristic for a state
  function calculateHeuristic(state: SokobanState): number {
    const level = state.level;
    let totalDistance = 0;

    // Find all boxes and targets
    const boxes: LevelPosition[] = [];
    const targets: LevelPosition[] = [];

    for (let y = 0; y < level.length; y++) {
      for (let x = 0; x < level[y].length; x++) {
        const cell = level[y][x];

        if (cell === CELL.BOX) {
          boxes.push({ x, y });
        } else if (cell === CELL.BOX_ON_TARGET) {
          boxes.push({ x, y });
          targets.push({ x, y });
        } else if (cell === CELL.TARGET || cell === CELL.PLAYER_ON_TARGET) {
          targets.push({ x, y });
        }
      }
    }

    // Calculate minimum distance from each box to a target
    for (const box of boxes) {
      let minDistance = Number.MAX_SAFE_INTEGER;

      for (const target of targets) {
        const distance = manhattanDistance(box, target);
        minDistance = Math.min(minDistance, distance);
      }

      totalDistance += minDistance;
    }

    return totalDistance;
  }

  // Calculate Manhattan distance between two positions
  function manhattanDistance(pos1: LevelPosition, pos2: LevelPosition): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  // Create a hash for a state to check for duplicates
  function hashState(state: SokobanState): string {
    // We only care about the level layout and player position for the hash
    return JSON.stringify({
      level: state.level,
      playerPos: state.playerPos
    });
  }

  const initialLevel = deepCopy(level);
  const playerPos = findPlayerInLevel(initialLevel);

  if (!playerPos) {
    console.error("No player found in the level");
    return null;
  }

  // Create initial state
  const initialState: SokobanState = {
    level: initialLevel,
    playerPos,
    moves: [],
    pushes: 0,
    steps: 0
  };

  // Create initial node
  const startNode: Node = {
    state: initialState,
    gScore: 0,
    fScore: calculateHeuristic(initialState),
    parent: null
  };

  // Open set contains nodes to be evaluated
  const openSet: Node[] = [startNode];

  // Closed set contains already evaluated nodes
  // We'll use a Map to store the state hash -> node
  const closedSet = new Map<string, Node>();

  while (openSet.length > 0) {
    // Get the node with the lowest fScore
    openSet.sort((a, b) => a.fScore - b.fScore);
    const currentNode = openSet.shift()!;

    // Check if the level is solved
    if (isLevelDone(currentNode.state.level)) {
      // Reconstruct the path
      return {
        moves: currentNode.state.moves
      };
    }

    // Add current node to closed set
    const stateHash = hashState(currentNode.state);
    closedSet.set(stateHash, currentNode);

    // Explore neighbors
    for (const direction of DIRECTIONS) {
      const { dx, dy, name } = direction;
      const newPlayerPos = {
        x: currentNode.state.playerPos.x + dx,
        y: currentNode.state.playerPos.y + dy
      };

      // Check if the new position is valid
      if (isPosOutOfBounds(currentNode.state.level, newPlayerPos.x, newPlayerPos.y)) {
        continue;
      }

      const newLevel = deepCopy(currentNode.state.level);
      const currentCell = newLevel[currentNode.state.playerPos.y][currentNode.state.playerPos.x];
      const targetCell = newLevel[newPlayerPos.y][newPlayerPos.x];

      // Check if the target cell is a wall
      if (targetCell === CELL.WALL) {
        continue;
      }

      let isPush = false;

      // Check if the target cell is a box or a box on target
      if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
        // Calculate the position behind the box
        const behindBoxPos = {
          x: newPlayerPos.x + dx,
          y: newPlayerPos.y + dy
        };

        // Check if the position behind the box is valid
        if (isPosOutOfBounds(newLevel, behindBoxPos.x, behindBoxPos.y)) {
          continue;
        }

        const behindBoxCell = newLevel[behindBoxPos.y][behindBoxPos.x];

        // Check if the position behind the box is free
        if (behindBoxCell !== CELL.SPACE && behindBoxCell !== CELL.TARGET) {
          continue;
        }

        // Move the box
        if (behindBoxCell === CELL.SPACE) {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX;
        } else {
          newLevel[behindBoxPos.y][behindBoxPos.x] = CELL.BOX_ON_TARGET;
        }

        isPush = true;
      }

      // Update the target cell
      if (targetCell === CELL.SPACE || targetCell === CELL.BOX) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER;
      } else if (targetCell === CELL.TARGET || targetCell === CELL.BOX_ON_TARGET) {
        newLevel[newPlayerPos.y][newPlayerPos.x] = CELL.PLAYER_ON_TARGET;
      }

      // Update the current cell
      if (currentCell === CELL.PLAYER) {
        newLevel[currentNode.state.playerPos.y][currentNode.state.playerPos.x] = CELL.SPACE;
      } else if (currentCell === CELL.PLAYER_ON_TARGET) {
        newLevel[currentNode.state.playerPos.y][currentNode.state.playerPos.x] = CELL.TARGET;
      }

      // Create new state
      const newState: SokobanState = {
        level: newLevel,
        playerPos: newPlayerPos,
        moves: [...currentNode.state.moves, name],
        pushes: currentNode.state.pushes + (isPush ? 1 : 0),
        steps: currentNode.state.steps + 1
      };

      // Calculate new scores
      const newGScore = currentNode.gScore + 1 + (isPush ? 1 : 0); // Extra cost for pushing
      const newFScore = newGScore + calculateHeuristic(newState);

      // Check if the state is already in the closed set
      const newStateHash = hashState(newState);
      const existingClosedNode = closedSet.get(newStateHash);

      if (existingClosedNode && newGScore >= existingClosedNode.gScore) {
        continue;
      }

      // Check if the state is already in the open set
      const existingOpenNodeIndex = openSet.findIndex(node =>
        hashState(node.state) === newStateHash
      );

      if (existingOpenNodeIndex !== -1) {
        const existingOpenNode = openSet[existingOpenNodeIndex];

        if (newGScore < existingOpenNode.gScore) {
          // Update the existing node
          existingOpenNode.state = newState;
          existingOpenNode.gScore = newGScore;
          existingOpenNode.fScore = newFScore;
          existingOpenNode.parent = currentNode;
        }
      } else {
        // Add new node to open set
        openSet.push({
          state: newState,
          gScore: newGScore,
          fScore: newFScore,
          parent: currentNode
        });
      }
    }
  }

  // No solution found
  return null;
}
