<script setup lang="ts">
import GameBoard from './components/GameBoard.vue';
import ConfettiLauncher from './components/ConfettiLauncher.vue';
import { useConfetti } from "./composables/useConfetti";

const { confettiTrigger } = useConfetti()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-8 bg-[#fafafa]">
    <h1 class="sr-only">Sokoban</h1>
    <ConfettiLauncher :trigger="confettiTrigger" />
    <GameBoard />
  </div>
</template>
