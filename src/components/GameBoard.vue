<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { onKeyStroke } from "@vueuse/core";
import { useConfetti } from "@/composables/useConfetti";
import { deepCopy } from "@/utils/utils";
import MoveIcon from "./icons/MoveIcon.vue";
import PlayerIcon from "./icons/PlayerIcon.vue";
import ClockIcon from "./icons/ClockIcon.vue";
import StepsIcon from "./icons/StepsIcon.vue";
import CrownIcon from "./icons/CrownIcon.vue";

const { confetti } = useConfetti();

type Cell = (typeof CELL)[keyof typeof CELL];
type Level = Cell[][];
type LevelPosition = { x: number; y: number };
type GameState = {
  level: Level;
  playerPosition: LevelPosition;
  moveCount: number;
};

const CELL = {
  WALL: "#",
  BOX: "$",
  PLAYER: "@",
  TARGET: ".",
  SPACE: " ",
  BOX_ON_TARGET: "*",
  PLAYER_ON_TARGET: "+",
} as const;

const levels: Level[] = [
  [
    ["#", "#", "#", "#", "#"],
    ["#", ".", ".", ".", "#"],
    ["#", "$", "$", "$", "#"],
    ["#", "@", ".", " ", "#"],
    ["#", "#", "#", "#", "#"],
  ],
];
const generateLevel = () => deepCopy(levels[0]);

// Game state
const level = ref(generateLevel());
const playerPosition = ref(findPlayerInLevel(level.value)!);
const moveCount = ref(0);
const gameTime = ref(0);
const timerInterval = ref<number | null>(null);
const moveHistory = ref<GameState[]>([]);
const recordMoves = ref(
  localStorage.getItem("recordMoves")
    ? parseInt(localStorage.getItem("recordMoves")!)
    : Infinity
);
const recordTime = ref(
  localStorage.getItem("recordTime")
    ? parseInt(localStorage.getItem("recordTime")!)
    : Infinity
);

const formattedTime = computed(() => {
  const minutes = Math.floor(gameTime.value / 60);
  const seconds = gameTime.value % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
});

function formatTime(time: number): string {
  if (time === Infinity) return "--:--";
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

const gameStatus = computed<"won" | "playing" | "lost">(() => {
  const hasWon = !level.value.some((row) => row.includes(CELL.BOX));
  return hasWon ? "won" : "playing";
});

onMounted(() => startTimer());
onUnmounted(() => stopTimer());

function startTimer() {
  stopTimer(); // Clear any existing timer
  timerInterval.value = window.setInterval(() => {
    gameTime.value++;
  }, 1000);
}

function stopTimer() {
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
}

watch(
  gameStatus,
  (newStatus) => {
    if (newStatus === "won") {
      confetti();
      stopTimer();

      if (!recordMoves.value || moveCount.value < recordMoves.value) {
        recordMoves.value = moveCount.value;
        localStorage.setItem("recordMoves", recordMoves.value.toString());
      }

      if (!recordTime.value || gameTime.value < recordTime.value) {
        recordTime.value = gameTime.value;
        localStorage.setItem("recordTime", recordTime.value.toString());
      }
    }
  },
  { immediate: true }
);

onKeyStroke(
  ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "r", "R", "u", "U"],
  (event) => {
    switch (event.key) {
      case "ArrowUp":
        return move(0, -1);
      case "ArrowDown":
        return move(0, 1);
      case "ArrowLeft":
        return move(-1, 0);
      case "ArrowRight":
        return move(1, 0);
      case "R":
      case "r":
        restartGame();
        break;
      case "U":
      case "u":
        undoMove();
    }
  }
);

function isPosOutOfBounds(x: number, y: number) {
  return (
    x < 0 || x >= level.value[0].length || y < 0 || y >= level.value.length
  );
}

function move(dx: number, dy: number) {
  if (gameStatus.value === "won") return;

  const player = playerPosition.value;
  const newX = player.x + dx;
  const newY = player.y + dy;
  const isOutOfBounds = isPosOutOfBounds(newX, newY);
  if (isOutOfBounds) return;

  const currentCell = level.value[player.y][player.x];
  const targetCell = level.value[newY][newX];
  const hasHitWall = targetCell === CELL.WALL;
  if (hasHitWall) return;

  moveHistory.value.push({
    level: deepCopy(level.value),
    playerPosition: { ...playerPosition.value },
    moveCount: moveCount.value,
  });

  if (targetCell === CELL.SPACE || targetCell === CELL.TARGET) {
    level.value[player.y][player.x] =
      currentCell === CELL.PLAYER_ON_TARGET ? CELL.TARGET : CELL.SPACE;
    level.value[newY][newX] =
      targetCell === CELL.TARGET ? CELL.PLAYER_ON_TARGET : CELL.PLAYER;
    playerPosition.value = { x: newX, y: newY };
    moveCount.value++;
    return;
  }

  if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
    const boxNextX = newX + dx;
    const boxNextY = newY + dy;
    const willBoxBeOutOfBounds = isPosOutOfBounds(boxNextX, boxNextY);
    if (willBoxBeOutOfBounds) return;

    const boxNextCell = level.value[boxNextY][boxNextX];
    if (boxNextCell === CELL.SPACE || boxNextCell === CELL.TARGET) {
      level.value[boxNextY][boxNextX] =
        boxNextCell === CELL.TARGET ? CELL.BOX_ON_TARGET : CELL.BOX;
      level.value[player.y][player.x] =
        currentCell === CELL.PLAYER_ON_TARGET ? CELL.TARGET : CELL.SPACE;
      level.value[newY][newX] =
        targetCell === CELL.BOX_ON_TARGET ? CELL.PLAYER_ON_TARGET : CELL.PLAYER;
      playerPosition.value = { x: newX, y: newY };
      moveCount.value++;
    }
  }
}

function restartGame() {
  const newLevel = deepCopy(levels[0]);
  level.value = newLevel;
  playerPosition.value = findPlayerInLevel(newLevel)!;
  moveCount.value = 0;
  gameTime.value = 0;
  moveHistory.value = [];
  startTimer();
}

function undoMove() {
  if (moveHistory.value.length === 0) return;

  const previousState = moveHistory.value.pop()!;
  level.value = deepCopy(previousState.level);
  playerPosition.value = { ...previousState.playerPosition };
  moveCount.value++;
}

function findPlayerInLevel(level: Level): LevelPosition | null {
  return (
    level
      .flatMap((row, y) =>
        row.map((type, x) => (type === CELL.PLAYER ? { x, y } : null))
      )
      .find(Boolean) ?? null
  );
}
</script>

<template>
  <div
    v-if="gameStatus === 'won'"
    class="flex flex-col justify-center items-center p-8 font-light outline-none rounded-xl min-h-[300px] min-w-[300px]"
  >
    <div class="text-center">
      <h2 class="text-3xl text-[#2c3e50] mb-4">You Won!</h2>

      <!-- Move count in big text -->
      <div class="text-6xl font-light text-[#3498db] mb-2">{{ moveCount }}</div>
      <div class="text-sm text-[#666] mb-6">moves</div>

      <!-- Time and records -->
      <div
        class="flex justify-between w-full max-w-[250px] mb-6 text-[#666] text-sm"
      >
        <div>
          <div class="flex items-center gap-1 mb-1">
            <ClockIcon />
            <span>{{ formattedTime }}</span>
          </div>
          <div class="flex items-center gap-1">
            <StepsIcon />
            <span>{{ moveCount }}</span>
          </div>
        </div>

        <div class="text-right">
          <div class="flex items-center justify-end gap-1 mb-1">
            <span>{{ formatTime(recordTime) }}</span>
            <CrownIcon />
          </div>
          <div class="flex items-center justify-end gap-1">
            <span>{{ recordMoves === Infinity ? "-" : recordMoves }}</span>
            <CrownIcon />
          </div>
        </div>
      </div>

      <button
        @click="restartGame"
        class="px-6 py-3 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors duration-200 focus:outline-none"
      >
        Play Again
      </button>
    </div>
  </div>

  <div
    v-else
    class="flex flex-col justify-center items-center p-8 outline-none rounded-xl"
    tabindex="0"
    ref="boardRef"
  >
    <!-- Game stats display -->
    <div class="flex justify-between w-full max-w-[300px] mb-6 text-[#666]">
      <div class="flex items-center gap-1">
        <span>{{ formattedTime }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span>{{ moveCount }}</span>
      </div>
    </div>

    <!-- Game Board -->
    <div class="flex flex-col gap-0.5 bg-white rounded-lg">
      <div v-for="(row, y) in level" :key="y" class="flex gap-0.5">
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="w-12 h-12 rounded flex items-center justify-center"
          :class="{
            'bg-[#2c3e50]': cell === '#',
            'bg-[#ddb61c] rounded-full scale-[30%]': cell === '.',
            'bg-[#e67e22]': cell === '$',
            'bg-[#27ae60]': cell === '*',
            'bg-[#3498db] rounded-full relative': cell === '@' || cell === '+',
          }"
        >
          <PlayerIcon v-if="cell === '@' || cell === '+'" />
        </div>
      </div>
    </div>

    <!-- Keyboard shortcuts hint -->
    <div class="flex gap-4 mt-6 text-xs text-[#999] font-light">
      <div class="flex items-center">
        <span
          class="inline-flex items-center justify-center px-1 py-0.5 bg-[#f1f1f1] rounded mr-1.5 text-[#666] font-light"
        >
          <MoveIcon />
        </span>
        <span>Move</span>
      </div>
      <div class="flex items-center">
        <span
          class="inline-block px-1.5 py-0.5 bg-[#f1f1f1] rounded mr-1.5 text-[#666] font-medium"
        >
          R
        </span>
        <span>Reset</span>
      </div>
      <div class="flex items-center">
        <span
          class="inline-block px-1.5 py-0.5 bg-[#f1f1f1] rounded mr-1.5 text-[#666] font-medium"
        >
          U
        </span>
        <span>Undo</span>
      </div>
    </div>
  </div>
</template>
