<script setup lang="ts">
import { levels } from "@/composables/useLevels";
import { onClickOutside } from "@vueuse/core";
import { useTemplateRef } from "vue";

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

function selectLevel(index: number) {
  emit("select", index);
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
        <h2 class="text-2xl font-light text-[#2c3e50]">Select a Level</h2>
        <button
          @click="$emit('close')"
          class="text-[#999] hover:text-[#666] text-xl"
        >
          ×
        </button>
      </div>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <button
          v-for="(levelData, index) in levels"
          :key="index"
          @click="selectLevel(index)"
          class="p-4 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-lg transition-colors duration-200 flex flex-col items-center"
          :class="{ 'border-2 border-[#3498db]': index === selectedLevelIndex }"
        >
          <div class="text-lg font-light mb-2">Level {{ index + 1 }}</div>
          <div
            class="w-full aspect-square bg-[#fafafa] rounded overflow-hidden flex items-center justify-center"
          >
            <div class="transform scale-[0.4] origin-center">
              <div v-for="(row, y) in levelData.level" :key="y" class="flex">
                <div
                  v-for="(cell, x) in row"
                  :key="x"
                  class="w-6 h-6 rounded"
                  :class="{
                    'bg-[#2c3e50]': cell === '#',
                    'bg-[#ddb61c] rounded-full scale-[30%]': cell === '.',
                    'bg-[#e67e22]': cell === '$',
                    'bg-[#27ae60]': cell === '*',
                    'bg-[#3498db] rounded-full': cell === '@' || cell === '+',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
