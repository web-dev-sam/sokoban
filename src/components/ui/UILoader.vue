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
          class="inline-block w-12 h-12 border-4 border-[#3498db] border-t-transparent rounded-full animate-spin"
        ></div>
        <div class="mt-4 text-[#666]">Loading levels...</div>
      </div>
    </div>
    <div v-else-if="loadingStatus === 'fail'">
      <div class="text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-[#f00] border-t-transparent rounded-full animate-spin"
        ></div>
        <div class="mt-4 text-[#666]">Loading failed, try reloading...</div>
      </div>
    </div>
    <slot v-else />
  </div>
</template>
