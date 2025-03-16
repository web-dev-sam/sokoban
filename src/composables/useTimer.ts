import { ref } from 'vue';

export function useTimer() {
  const time = ref(0);
  const timerInterval = ref<number | null>(null);
  const isRunning = ref(false);

  const startTimer = () => {
    if (timerInterval.value === null) {
      isRunning.value = true;
      timerInterval.value = window.setInterval(() => {
        time.value++;
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerInterval.value !== null) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
      isRunning.value = false;
    }
  };

  const resetTimer = () => {
    stopTimer();
    time.value = 0;
  };

  const restartTimer = () => {
    resetTimer();
    startTimer();
  };

  return {
    time,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer,
    restartTimer
  };
}