<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { onKeyStroke, useLocalStorage } from "@vueuse/core";
import {
  CELL,
  deepCopy,
  findPlayerInLevel,
  isLevelDone,
  isPosOutOfBounds,
  type GameState,
  type Level,
  type LevelPosition,
} from "@/utils/utils";
import { createLevel } from "@/composables/useLevels";
import { useConfetti } from "@/composables/useConfetti";
import { useTimer } from "@/composables/useTimer";
import LevelSelector from "./LevelSelector.vue";
import WinView from "./WinView.vue";
import SokobanStats from "./SokobanStats.vue";
import SokobanBoard from "./SokobanBoard.vue";
import SokobanToolbar from "./SokobanToolbar.vue";

const { time, startTimer, stopTimer, restartTimer } = useTimer();
const { confetti } = useConfetti();
const ownRecord = useLocalStorage(
  "own-record",
  { moves: null as number | null, time: null as number | null },
  { mergeDefaults: true }
);

const isLevelSelectorShown = ref(false);
const currentLevelIndex = ref(0);
const level = ref<Level>([]);
const title = ref("");
const playerPosition = ref<LevelPosition>({ x: 0, y: 0 });
const moves = ref(0);
const moveHistory = ref<GameState[]>([]);
const gameStatus = ref<"won" | "playing">("playing");

onMounted(async () => {
  const {
    level: newLevel,
    playerPos,
    title: newTitle,
  } = createLevel(currentLevelIndex.value);
  level.value = newLevel;
  playerPosition.value = playerPos;
  title.value = newTitle;
  startTimer();
});
onUnmounted(() => stopTimer());

watch(moves, () => {
  const hasWon = isLevelDone(level.value);
  if (hasWon) {
    gameStatus.value = "won";
    confetti();
    stopTimer();
    const currentRecord = ownRecord.value;
    if (currentRecord.moves == null || currentRecord.time == null) {
      ownRecord.value = { moves: moves.value, time: time.value };
    } else {
      const isBetterTime = time.value < currentRecord.time;
      const isBetterMoves = moves.value < currentRecord.moves;
      ownRecord.value = {
        moves: isBetterMoves ? moves.value : ownRecord.value.moves,
        time: isBetterTime ? time.value : ownRecord.value.time,
      };
    }
  }
});

onKeyStroke(
  [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "r",
    "R",
    "u",
    "U",
    "l",
    "L",
    "W",
    "w",
    "A",
    "a",
    "S",
    "s",
    "D",
    "d",
    "Escape",
  ],
  (event) => {
    const allowedInLvlSelector = ["l", "L", "R", "r", "Escape"];
    const allowedInWinView = ["l", "L", "R", "r"];
    if (isLevelSelectorShown.value && !allowedInLvlSelector.includes(event.key))
      return;
    if (gameStatus.value === "won" && !allowedInWinView.includes(event.key))
      return;

    switch (event.key) {
      case "ArrowUp":
      case "W":
      case "w":
        return move(0, -1);
      case "ArrowDown":
      case "S":
      case "s":
        return move(0, 1);
      case "ArrowLeft":
      case "A":
      case "a":
        return move(-1, 0);
      case "ArrowRight":
      case "D":
      case "d":
        return move(1, 0);
      case "R":
      case "r":
        restartGame();
        break;
      case "U":
      case "u":
        undoMove();
        break;
      case "L":
      case "l":
        isLevelSelectorShown.value = !isLevelSelectorShown.value;
        break;
      case "Escape":
        isLevelSelectorShown.value = false;
        break;
    }
  }
);

function move(dx: number, dy: number) {
  if (gameStatus.value === "won") return;

  const player = playerPosition.value;
  const newX = player.x + dx;
  const newY = player.y + dy;
  const isOutOfBounds = isPosOutOfBounds(level.value, newX, newY);
  if (isOutOfBounds) return;

  const currentCell = level.value[player.y][player.x];
  const targetCell = level.value[newY][newX];
  const hasHitWall = targetCell === CELL.WALL;
  if (hasHitWall) return;

  moveHistory.value.push({
    level: deepCopy(level.value),
    moveCount: moves.value,
    time: time.value,
  });

  if (targetCell === CELL.SPACE || targetCell === CELL.TARGET) {
    level.value[player.y][player.x] =
      currentCell === CELL.PLAYER_ON_TARGET ? CELL.TARGET : CELL.SPACE;
    level.value[newY][newX] =
      targetCell === CELL.TARGET ? CELL.PLAYER_ON_TARGET : CELL.PLAYER;
    playerPosition.value = { x: newX, y: newY };
    moves.value++;
    return;
  }

  if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
    const boxNextX = newX + dx;
    const boxNextY = newY + dy;
    const willBoxBeOutOfBounds = isPosOutOfBounds(
      level.value,
      boxNextX,
      boxNextY
    );
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
      moves.value++;
    }
  }
}

function undoMove() {
  const previousState = moveHistory.value.pop();
  if (previousState == null) return;

  const previousLevelInstance = deepCopy(previousState.level);
  level.value = previousLevelInstance;
  playerPosition.value = findPlayerInLevel(previousLevelInstance)!;
  moves.value++;
}

function restartGame() {
  const {
    level: newLevel,
    playerPos,
    title: newTitle,
  } = createLevel(currentLevelIndex.value);
  level.value = newLevel;
  playerPosition.value = playerPos;
  title.value = newTitle;
  moves.value = 0;
  moveHistory.value = [];
  isLevelSelectorShown.value = false;
  gameStatus.value = "playing";
  restartTimer();
}

function selectLevel(index: number) {
  currentLevelIndex.value = index;
  const { level: newLevel, playerPos, title: newTitle } = createLevel(index);
  level.value = newLevel;
  playerPosition.value = playerPos;
  title.value = newTitle;
  moves.value = 0;
  moveHistory.value = [];
  isLevelSelectorShown.value = false;
  gameStatus.value = "playing";
  restartTimer();
}
</script>

<template>
  <LevelSelector
    v-show="isLevelSelectorShown"
    :selected-level-index="currentLevelIndex"
    @select="selectLevel"
    @close="isLevelSelectorShown = false"
  />
  <WinView
    v-if="gameStatus === 'won'"
    :moves
    :time
    :record-moves="ownRecord.moves"
    :record-time="ownRecord.time"
    @restart="restartGame"
  />

  <div
    v-else
    class="flex flex-col justify-center items-center p-8 outline-none rounded-xl"
    tabindex="0"
    ref="boardRef"
  >
    <SokobanStats :moves :time :title />
    <SokobanBoard :level />
    <SokobanToolbar />
  </div>
</template>
