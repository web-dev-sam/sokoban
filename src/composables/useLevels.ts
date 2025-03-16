import { deepCopy, DEFAULT_LEVEL, findPlayerInLevel, type Level, type LevelPosition } from "@/utils/utils";
import { ref, computed } from "vue";

export type LevelInfo = {
  title: string
  author: string
  email: string
  url: string
  level: Level
};
export type LevelData = LevelInfo[];
export type Collection = {
  name: string;
  levels: LevelInfo[];
};
export type CollectionData = Collection[];

export const allLevels = ref<LevelData>([
  {
    title: "Tutorial",
    author: "",
    email: "sam@webry.com",
    url: "https://sokoban.webry.com/",
    level: DEFAULT_LEVEL,
  }
]);

export const collections = ref<CollectionData>([
  {
    name: "Tutorial",
    levels: [allLevels.value[0]]
  }
]);

export const selectedCollectionIndex = ref(0);

export const levels = computed(() => {
  if (selectedCollectionIndex.value >= 0 && selectedCollectionIndex.value < collections.value.length) {
    return collections.value[selectedCollectionIndex.value].levels;
  }
  return [];
});

export function createLevel(index: number): { level: Level, title: string, playerPos: LevelPosition } {
  const currentCollection = collections.value[selectedCollectionIndex.value];
  const isValidIndex = index < currentCollection.levels.length;
  const newLevel = currentCollection.levels[isValidIndex ? index : 0];
  const level = deepCopy(newLevel.level);

  return {
    level,
    title: newLevel.title,
    playerPos: findPlayerInLevel(level)! // Assuming there is always a player in a level
  };
}

export function selectCollection(index: number): void {
  if (index >= 0 && index < collections.value.length) {
    selectedCollectionIndex.value = index;
  }
}
