<script setup lang="ts">
import ConfettiLauncher from "./components/ConfettiLauncher.vue";
import SokobanGame from "./components/SokobanGame.vue";
import UILoader from "./components/ui/UILoader.vue";
import { useConfetti } from "./composables/useConfetti";
import { levels, type LevelData } from "./composables/useLevels";
import { ref } from "vue";
import type { Cell, Level } from "./utils/utils";

const { confettiTrigger } = useConfetti();

const loadingStatus = ref<"success" | "pending" | "fail">("pending");

loadLevels();

type LevelFetchData = {
  t: string;
  a: string;
  e: string;
  u: string;
  l: string;
}[];

async function loadLevels() {
  try {
    const response = await fetch("/original.json");
    const data = (await response.json()) as LevelFetchData;
    levels.value = data.map((e) => ({
      title: e.t,
      author: e.a,
      email: e.e,
      url: e.u,
      level: e.l.split("|").map((row) => row.split("") as Cell[]),
    }));
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
