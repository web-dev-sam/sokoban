import { deepCopy, DEFAULT_LEVEL, findPlayerInLevel, type Level, type LevelPosition } from "@/utils/utils";
import { ref } from "vue";


export type LevelData = {
  title: string
  author: string
  email: string
  url: string
  level: Level
}[];
export const levels = ref<LevelData>([
  {
    title: "Tutorial",
    author: "",
    email: "sam@webry.com",
    url: "https://sokoban.webry.com/",
    level: DEFAULT_LEVEL,
  }
]);


export function createLevel(index: number): { level: Level, title: string, playerPos: LevelPosition } {
  const isValidIndex = index < levels.value.length;
  const newLevel = levels.value[isValidIndex ? index : 0];
  const level = deepCopy(newLevel.level);
  return {
    level,
    title: newLevel.title,
    playerPos: findPlayerInLevel(level)! // Assuming there is always a player in a level
  };
}