<script setup lang="ts">
import { formatTime } from "@/utils/utils";
import ClockIcon from "./icons/ClockIcon.vue";
import StepsIcon from "./icons/StepsIcon.vue";
import CrownIcon from "./icons/CrownIcon.vue";

defineProps<{
  moves: number;
  time: number;
  recordMoves: number;
  recordTime: number;
}>();

defineEmits<{
  (event: "restart"): void;
}>();
</script>

<template>
  <div
    class="flex flex-col justify-center items-center p-8 font-light outline-none rounded-xl min-h-[300px] min-w-[300px]"
  >
    <div class="text-center">
      <h2 class="text-3xl text-[#2c3e50] mb-4">You Won!</h2>

      <div class="text-6xl font-light text-[#3498db] mb-2">{{ moves }}</div>
      <div class="text-sm text-[#666] mb-6">moves</div>

      <div
        class="flex justify-between w-full max-w-[250px] mb-6 text-[#666] text-sm"
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
            <span>{{ !isFinite(recordMoves) || recordMoves == null ? "-" : recordMoves }}</span>
            <CrownIcon />
          </div>
        </div>
      </div>

      <button
        @click="$emit('restart')"
        class="px-6 py-3 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors duration-200 focus:outline-none"
      >
        Play Again
      </button>
    </div>
  </div>
</template>
