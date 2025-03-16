<script setup lang="ts">
import MoveIcon from "./icons/MoveIcon.vue";
</script>

<template>
  <div class="flex gap-4 mt-6 text-sm md:text-base text-gray-dark font-light">
    <div class="flex items-center">
      <span
        class="inline-flex items-center justify-center h-7 px-1 py-0.5 bg-bg-secondary rounded mr-1.5 text-text-secondary font-light"
      >
        <MoveIcon />
      </span>
      <span>Move</span>
    </div>
    <div class="flex items-center">
      <span
        class="inline-block px-1.5 py-0.5 bg-bg-secondary rounded mr-1.5 text-text-secondary font-medium"
      >
        R
      </span>
      <span>Reset</span>
    </div>
    <div class="flex items-center">
      <span
        class="inline-block px-1.5 py-0.5 bg-bg-secondary rounded mr-1.5 text-text-secondary font-medium"
      >
        U
      </span>
      <span>Undo</span>
    </div>
    <div class="flex items-center">
      <span
        class="inline-block px-1.5 py-0.5 bg-bg-secondary rounded mr-1.5 text-text-secondary font-medium"
      >
        L
      </span>
      <span>Levels</span>
    </div>
  </div>
</template>
