import { CELL } from "./utils";

export type Direction = "UP" | "DOWN" | "RIGHT" | "LEFT"

export function findPathToCell(level: string[][], playerPosition: { x: number, y: number }, targetX: number, targetY: number): Direction[] {
  const moves: {
    dx: number
    dy: number
    direction: Direction
  }[] = [
      { dx: 0, dy: -1, direction: "UP" },
      { dx: 0, dy: 1, direction: "DOWN" },
      { dx: 1, dy: 0, direction: "RIGHT" },
      { dx: -1, dy: 0, direction: "LEFT" }
    ];

  const queue: { x: number, y: number, path: Direction[] }[] = [];
  queue.push({ x: playerPosition.x, y: playerPosition.y, path: [] });

  const visited = new Set<string>();
  visited.add(`${playerPosition.x},${playerPosition.y}`);

  // BFS
  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;
    if (x === targetX && y === targetY) {
      return path;
    }

    for (const move of moves) {
      const newX = x + move.dx;
      const newY = y + move.dy;
      const key = `${newX},${newY}`;

      if (
        newX >= 0 && newX < level[0].length &&
        newY >= 0 && newY < level.length &&
        !visited.has(key) &&
        [CELL.TARGET, CELL.SPACE].includes(level[newY][newX])
      ) {
        visited.add(key);
        queue.push({
          x: newX,
          y: newY,
          path: [...path, move.direction]
        });
      }
    }
  }

  return [];
}