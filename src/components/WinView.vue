<script setup lang="ts">
import { formatTime } from "@/utils/utils";
import ClockIcon from "./icons/ClockIcon.vue";
import StepsIcon from "./icons/StepsIcon.vue";
import CrownIcon from "./icons/CrownIcon.vue";
import { Repeat } from "lucide-vue-next";

defineProps<{
  moves: number;
  time: number;
  recordMoves: number | null;
  recordTime: number | null;
}>();

defineEmits<{
  (event: "restart"): void;
  (event: "selectLevel"): void;
  (event: "next"): void;
}>();
</script>

<template>
  <div
    class="flex flex-col justify-center items-center p-8 font-light outline-none rounded-xl min-h-[300px] min-w-[300px] bg-bg-primary"
  >
    <div class="text-center">
      <h2 class="text-3xl text-text-primary mb-4">You Won!</h2>

      <div class="text-6xl font-light text-blue mb-2">{{ moves }}</div>
      <div class="text-sm text-text-secondary mb-6">moves</div>

      <div
        class="flex justify-between w-full max-w-[250px] mb-6 text-text-secondary text-sm"
      >
        <div>
          <div class="flex items-center gap-1 mb-1">
            <ClockIcon />
            <span>{{ formatTime(time) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <StepsIcon />
            <span>{{ moves }}</span>
          </div>
        </div>

        <div class="text-right">
          <div class="flex items-center justify-end gap-1 mb-1">
            <span>{{ formatTime(recordTime) }}</span>
            <CrownIcon />
          </div>
          <div class="flex items-center justify-end gap-1">
            <span>{{ recordMoves == null ? "-" : recordMoves }}</span>
            <CrownIcon />
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          @click="$emit('restart')"
          class="px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none cursor-pointer flex items-center gap-1"
        >
          <Repeat :size="18" stroke-width="1" class="text-text-primary" />
        </button>

        <button
          @click="$emit('selectLevel')"
          class="px-4 py-2 bg-gray-medium rounded-lg transition-colors duration-200 focus:outline-none cursor-pointer text-text-primary"
        >
          Select <span class="underline">L</span>evel
        </button>

        <button
          @click="$emit('next')"
          class="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-dark transition-colors duration-200 focus:outline-none cursor-pointer"
        >
          <span class="underline">N</span>ext
        </button>
      </div>
    </div>
  </div>
</template>
