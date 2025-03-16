<script setup lang="ts">
import ConfettiLauncher from "./components/ConfettiLauncher.vue";
import SokobanGame from "./components/SokobanGame.vue";
import UILoader from "./components/ui/UILoader.vue";
import { useConfetti } from "./composables/useConfetti";
import {
  allLevels,
  collections,
  type LevelData,
} from "./composables/useLevels";
import { ref } from "vue";
import { decode, type LevelFetchData } from "./utils/decoder";

const { confettiTrigger } = useConfetti();

const loadingStatus = ref<"success" | "pending" | "fail">("pending");

const COLLECTIONS = [
  { name: "Original", path: "/original.json" },
  { name: "Beginner", path: "/beginner.json" },
];

(async () => {
  const results = await Promise.all(COLLECTIONS.map(loadLevels));
  const data = results.filter(
    (r): r is { levels: LevelData; collection: string; success: true } =>
      r.success
  );
  if (data.length === 0) {
    loadingStatus.value = "fail";
    return;
  }
  loadingStatus.value = "success";

  allLevels.value = data.flatMap(({ levels }) => levels);
  collections.value = data.map(({ collection, levels }) => ({
    name: collection,
    levels,
  }));
})();

async function loadLevels(collection: (typeof COLLECTIONS)[number]) {
  try {
    const response = await fetch(collection.path);
    const data = (await response.json()) as LevelFetchData;
    const decodedLevels = decode(data, collection.name);
    return {
      success: true,
      collection: collection.name,
      levels: decodedLevels,
    };
  } catch (error) {
    console.error("Error loading levels:", error);
    return {
      success: false,
    };
  }
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen p-8 bg-[#fafafa]"
  >
    <h1 class="sr-only">Sokoban</h1>
    <ConfettiLauncher :trigger="confettiTrigger" />
    <UILoader :loadingStatus>
      <SokobanGame />
    </UILoader>
  </div>
</template>
