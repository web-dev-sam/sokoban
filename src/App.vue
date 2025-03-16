<script setup lang="ts">
import ConfettiLauncher from "./components/ConfettiLauncher.vue";
import SokobanGame from "./components/SokobanGame.vue";
import UILoader from "./components/ui/UILoader.vue";
import { useConfetti } from "./composables/useConfetti";
import { allLevels, collections } from "./composables/useLevels";
import { ref } from "vue";
import { decode, type LevelFetchData } from "./utils/decoder";

const { confettiTrigger } = useConfetti();

const loadingStatus = ref<"success" | "pending" | "fail">("pending");

loadLevels();

async function loadLevels() {
  try {
    const response = await fetch("/original.json");
    const data = (await response.json()) as LevelFetchData;
    const decodedLevels = decode(data);
    allLevels.value = decodedLevels;

    const authorMap = new Map<string, typeof decodedLevels>();
    decodedLevels.forEach(level => {
      const author = level.author || "Unknown";
      if (!authorMap.has(author)) {
        authorMap.set(author, []);
      }
      authorMap.get(author)!.push(level);
    });
    const newCollections = Array.from(authorMap.entries()).map(([author, levels]) => ({
      name: author === "Unknown" ? "Miscellaneous" : author,
      levels
    }));
    newCollections.unshift({
      name: "All Levels",
      levels: decodedLevels
    });
    collections.value = newCollections;
    loadingStatus.value = "success";
  } catch (error) {
    console.error("Error loading levels:", error);
    loadingStatus.value = "fail";
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
