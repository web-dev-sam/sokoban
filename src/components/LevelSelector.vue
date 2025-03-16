<script setup lang="ts">
import { levels, collections, selectedCollectionIndex, selectCollection } from "@/composables/useLevels";
import { onClickOutside } from "@vueuse/core";
import { ref, useTemplateRef } from "vue";
import { ArrowLeft } from "lucide-vue-next"
import { CELL } from "@/utils/utils";

defineProps<{
  selectedLevelIndex: number;
}>();

const emit = defineEmits<{
  (event: "select", index: number): void;
  (event: "close"): void;
}>();

const lvlSelectorModalRef = useTemplateRef("level-selector-modal");
onClickOutside(lvlSelectorModalRef, () => {
  emit("close");
});

const showingCollections = ref(true);

function selectLevel(index: number) {
  emit("select", index);
}

function handleCollectionSelect(index: number) {
  selectCollection(index);
  showingCollections.value = false;
}

function goBackToCollections() {
  showingCollections.value = true;
}

/**
 * Generating SVG to improve performance
 */
function generateLevelSvg(level: string[][]) {
  if (!level || !level.length) return "";

  const rows = level.length;
  const cols = level[0].length;
  const maxSize = 200;
  const cellSize = Math.min(maxSize / Math.max(rows, cols), 6);
  const width = cols * cellSize;
  const height = rows * cellSize;
  let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = level[y][x];
      const cellX = x * cellSize;
      const cellY = y * cellSize;

      let fill = "";
      let isRounded = false;
      let isSmall = false;

      switch (cell) {
        case CELL.WALL:
          fill = "#2c3e50";
          break;
        case CELL.TARGET:
          fill = "#ddb61c";
          isRounded = true;
          isSmall = true;
          break;
        case CELL.BOX:
          fill = "#e67e22";
          break;
        case CELL.BOX_ON_TARGET:
          fill = "#27ae60";
          break;
        case CELL.PLAYER:
        case CELL.PLAYER_ON_TARGET:
          fill = "#3498db";
          isRounded = true;
          break;
        default:
          continue;
      }

      if (fill) {
        if (isRounded) {
          const cx = cellX + cellSize / 2;
          const cy = cellY + cellSize / 2;
          const radius = isSmall ? cellSize * 0.15 : cellSize / 2;
          svgContent += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" />`;
        } else {
          svgContent += `<rect x="${cellX}" y="${cellY}" width="${cellSize}" height="${cellSize}" fill="${fill}" />`;
        }
      }
    }
  }

  svgContent += "</svg>";
  return svgContent;
}
</script>

<template>
  <div
    class="fixed inset-0 bg-[#ddd] bg-opacity-50 flex items-center justify-center z-50"
  >
    <div
      ref="level-selector-modal"
      class="bg-white rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-auto"
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="inline-flex items-center text-2xl font-light text-[#2c3e50]">
          <template v-if="showingCollections">
            Select a Collection
          </template>
          <template v-else>
            <button 
              @click="goBackToCollections" 
              class="mr-2 text-[#3498db] hover:text-[#2980b9] cursor-pointer"
            >
              <ArrowLeft />
            </button>
            {{ collections[selectedCollectionIndex].name }}
          </template>
        </h2>
        <button
          @click="$emit('close')"
          class="text-[#999] hover:text-[#666] text-2xl cursor-pointer"
        >
          ×
        </button>
      </div>

      <!-- Collections View -->
      <div v-if="showingCollections" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <button
          v-for="(collection, index) in collections"
          :key="index"
          @click="handleCollectionSelect(index)"
          class="p-4 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-lg transition-colors duration-200 flex flex-col items-center cursor-pointer"
        >
          <div class="text-lg font-light mb-2">{{ collection.name }}</div>
          <div class="text-sm text-[#666]">{{ collection.levels.length }} levels</div>
        </button>
      </div>

      <!-- Levels View -->
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <button
          v-for="(levelData, index) in levels"
          :key="index"
          @click="selectLevel(index)"
          class="p-4 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-lg transition-colors duration-200 flex flex-col items-center cursor-pointer"
          :class="{ 'border-2 border-[#3498db]': index === selectedLevelIndex }"
        >
        <div class="text-lg font-light">{{ levelData.title }}</div>
        <div class="text-sm font-light mb-2 text-[#666]">{{ levelData.author }}</div>
          <div
            class="w-full aspect-square bg-[#fafafa] rounded overflow-hidden flex items-center justify-center"
            v-html="generateLevelSvg(levelData.level)"
          ></div>
        </button>
      </div>
    </div>
  </div>
</template>
