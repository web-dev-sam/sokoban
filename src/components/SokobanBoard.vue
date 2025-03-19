<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { type Level } from "@/utils/utils";
import PlayerIcon from "./icons/PlayerIcon.vue";

const props = defineProps<{
  level: Level;
}>();

const emit = defineEmits<{
  (event: "cell-click", x: number, y: number): void
}>()

const windowSize = ref({
  width: window.innerWidth,
  height: window.innerHeight,
});
const cellSize = computed(() => {
  if (!props.level || props.level.length === 0) return 48;

  const rows = props.level.length;
  const cols = props.level[0].length;

  const maxWidth = Math.min(windowSize.value.width - 40, 800);
  const maxHeight = windowSize.value.height - 300;

  const maxCellWidth = maxWidth / cols;
  const maxCellHeight = maxHeight / rows;

  return Math.max(
    20,
    Math.min(48, Math.floor(Math.min(maxCellWidth, maxCellHeight)))
  );
});

function handleResize() {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div
    class="sokoban-board flex flex-col gap-0.5 bg-gray-light rounded-lg overflow-auto max-w-full"
  >
    <div v-for="(row, y) in level" :key="y" class="flex gap-0.5">
      <div
        v-for="(cell, x) in row"
        :key="x"
        class="rounded group hover:bg-blue/10"
        :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
        @click="emit('cell-click', x, y)"
      >
        <div
          class="flex items-center justify-center w-full h-full rounded"
          :class="{
            'bg-dark': cell === '#',
            'bg-yellow rounded-full scale-[33%] group-hover:bg-blue':
              cell === '.',
            'bg-orange': cell === '$',
            'bg-green': cell === '*',
            'bg-blue rounded-full': cell === '@' || cell === '+',
          }"
        >
          <PlayerIcon v-if="cell === '@' || cell === '+'" />
          <div
            v-if="cell === ' '"
            class="hidden group-hover:block bg-blue w-4 h-4 rounded-full"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
