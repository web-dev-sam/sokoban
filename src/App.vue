<script setup lang="ts">
import ConfettiLauncher from "./components/ConfettiLauncher.vue";
import SokobanGame from "./components/SokobanGame.vue";
import UILoader from "./components/ui/UILoader.vue";
import { useConfetti } from "./composables/useConfetti";
import { levels } from "./composables/useLevels";
import { ref } from "vue";

const { confettiTrigger } = useConfetti();

const loadingStatus = ref<"success" | "pending" | "fail">("pending");

loadLevels();

async function loadLevels() {
  try {
    const response = await fetch("/original.json");
    levels.value = await response.json();
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
