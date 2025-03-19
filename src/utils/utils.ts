export function deepCopy<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

export type Cell = (typeof CELL)[keyof typeof CELL];
export type Level = Cell[][];
export type LevelPosition = { x: number; y: number };
export type GameState = {
  level: Level;
  moveCount: number;
  time: number;
};
export const CELL = {
  WALL: "#",
  BOX: "$",
  PLAYER: "@",
  TARGET: ".",
  SPACE: " ",
  BOX_ON_TARGET: "*",
  PLAYER_ON_TARGET: "+",
} as const;

export const DEFAULT_LEVEL: Level = [
  ["#", "#", "#", "#", "#"],
  ["#", ".", ".", ".", "#"],
  ["#", "$", "$", "$", "#"],
  ["#", "@", " ", " ", "#"],
  ["#", "#", "#", "#", "#"],
]

export function isPosOutOfBounds(level: Level, x: number, y: number) {
  return x < 0 || x >= level[0].length || y < 0 || y >= level.length;
}

export function findPlayerInLevel(level: Level): LevelPosition | null {
  return level
  .flatMap((row, y) =>
    row.map((type, x) => (type === CELL.PLAYER || type === CELL.PLAYER_ON_TARGET ? { x, y } : null))
  )
  .find(Boolean) ?? null
}

export function isLevelDone(level: Level) {
  return !level.some((row) => row.includes(CELL.BOX));
}


export function formatTime(time: number | null) {
  if (time == null) return "--:--";

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const mm = minutes.toString().padStart(2, "0")
  const ss = seconds.toString().padStart(2, "0")
  return `${mm}:${ss}`;
}

export async function wait(ms: number) {
  await new Promise(res => setTimeout(res, ms));
}