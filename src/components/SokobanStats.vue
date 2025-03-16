<script setup lang="ts">
import { formatTime } from "@/utils/utils";

defineProps<{
  moves: number;
  time: number;
  title: string;
}>();
</script>

<template>
  <div class="-translate-y-2 sm:-translate-y-3 text-base sm:text-lg text-text-primary truncate max-w-full px-2">{{ title }}</div>
  <div class="flex justify-between w-full max-w-[300px] mb-4 sm:mb-6 text-text-secondary text-sm sm:text-base">
    <div class="flex items-center gap-1">
      <span>{{ formatTime(time) }}</span>
    </div>
    <div class="flex items-center gap-1">
      <span>{{ moves }}</span>
    </div>
  </div>
</template>
