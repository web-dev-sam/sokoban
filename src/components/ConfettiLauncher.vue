<script setup lang="ts">
import { vConfetti } from "@neoconfetti/vue";
import { ref, watch } from "vue";

const props = defineProps<{
  trigger: boolean;
}>();

const showConfetti = ref(false);
const stageHeight = window.innerHeight;

watch(
  () => props.trigger,
  () => {
    showConfetti.value = true;
    setTimeout(() => {
      showConfetti.value = false;
    }, 3500);
  }
);
</script>

<template>
  <div
    v-if="showConfetti"
    v-confetti="{ duration: 3500, stageHeight }"
    class="pointer-events-none"
  ></div>
</template>
