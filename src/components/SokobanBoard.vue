<script setup lang="ts">
import type { Level } from "@/utils/utils";
import PlayerIcon from "./icons/PlayerIcon.vue";

defineProps<{
  level: Level;
}>();
</script>

<template>
  <div class="flex flex-col gap-0.5 bg-[#fafafa] rounded-lg">
    <div v-for="(row, y) in level" :key="y" class="flex gap-0.5">
      <div
        v-for="(cell, x) in row"
        :key="x"
        class="w-12 h-12 rounded flex items-center justify-center"
        :class="{
          'bg-[#2c3e50]': cell === '#',
          'bg-[#ddb61c] rounded-full scale-[30%]': cell === '.',
          'bg-[#e67e22]': cell === '$',
          'bg-[#27ae60]': cell === '*',
          'bg-[#3498db] rounded-full relative': cell === '@' || cell === '+',
        }"
      >
        <PlayerIcon v-if="cell === '@' || cell === '+'" />
      </div>
    </div>
  </div>
</template>
