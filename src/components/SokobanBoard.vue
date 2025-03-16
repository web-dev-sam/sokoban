<script setup lang="ts">
import type { Level } from "@/utils/utils";
import PlayerIcon from "./icons/PlayerIcon.vue";

defineProps<{
  level: Level;
}>();
</script>

<template>
  <div class="flex flex-col gap-0.5 bg-gray-light rounded-lg">
    <div v-for="(row, y) in level" :key="y" class="flex gap-0.5">
      <div
        v-for="(cell, x) in row"
        :key="x"
        class="w-12 h-12 rounded flex items-center justify-center"
        :class="{
          'bg-dark': cell === '#',
          'bg-yellow rounded-full scale-[30%]': cell === '.',
          'bg-orange': cell === '$',
          'bg-green': cell === '*',
          'bg-blue rounded-full relative': cell === '@' || cell === '+',
        }"
      >
        <PlayerIcon v-if="cell === '@' || cell === '+'" />
      </div>
    </div>
  </div>
</template>
