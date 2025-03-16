<script setup lang="ts">
defineProps<{
  loadingStatus: "success" | "pending" | "fail";
}>();
</script>

<template>
  <div>
    <div
      v-if="loadingStatus === 'pending'"
      class="flex flex-col justify-center items-center p-8 font-light outline-none rounded-xl min-h-[300px] min-w-[300px]"
    >
      <div class="text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <div class="mt-4 text-text-secondary">Loading levels...</div>
      </div>
    </div>
    <div 
      v-else-if="loadingStatus === 'fail'"
      class="flex flex-col justify-center items-center p-8 font-light outline-none rounded-xl min-h-[300px] min-w-[300px]"
    >
      <div class="text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <div class="mt-4 text-text-secondary">Loading failed, try reloading...</div>
      </div>
    </div>
    <slot v-else />
  </div>
</template>
