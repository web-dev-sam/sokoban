<script setup lang="ts">
import { formatTime } from "@/utils/utils";

defineProps<{
  moves: number;
  time: number;
  title: string;
}>();
</script>

<template>
  <div class="-translate-y-3 text-lg">{{ title }}</div>
  <div class="flex justify-between w-full max-w-[300px] mb-6 text-[#666]">
    <div class="flex items-center gap-1">
      <span>{{ formatTime(time) }}</span>
    </div>
    <div class="flex items-center gap-1">
      <span>{{ moves }}</span>
    </div>
  </div>
</template>
