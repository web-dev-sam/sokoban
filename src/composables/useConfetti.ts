import { ref } from "vue";

const confettiTrigger = ref(false);

export function useConfetti() {
  return {
    confetti: () => confettiTrigger.value = !confettiTrigger.value,
    confettiTrigger
  }
}