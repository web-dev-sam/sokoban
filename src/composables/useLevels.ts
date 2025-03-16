import { deepCopy, DEFAULT_LEVEL, findPlayerInLevel, type Level, type LevelPosition } from "@/utils/utils";
import { ref } from "vue";


export const levels = ref<Array<{
  title: string
  author: string
  level: Level
}>>([
  {
    title: "Tutorial",
    author: "",
    level: DEFAULT_LEVEL,
  }
]);


export function createLevel(index: number): { level: Level, playerPos: LevelPosition } {
  const isValidIndex = index < levels.value.length;
  const level = deepCopy(levels.value[isValidIndex ? index : 0].level);
  return {
    level,
    playerPos: findPlayerInLevel(level)! // Assuming there is always a player in a level
  };
}