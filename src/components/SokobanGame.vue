<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  computed,
} from "vue";
import { onKeyStroke, useLocalStorage, useSwipe } from "@vueuse/core";
import {
  CELL,
  deepCopy,
  findPlayerInLevel,
  isLevelDone,
  isPosOutOfBounds,
  wait,
  type GameState,
  type Level,
  type LevelPosition,
} from "@/utils/utils";
import { createLevel, selectedCollectionIndex } from "@/composables/useLevels";
import { useConfetti } from "@/composables/useConfetti";
import { useTimer } from "@/composables/useTimer";
import LevelSelector from "./LevelSelector.vue";
import WinView from "./WinView.vue";
import SokobanStats from "./SokobanStats.vue";
import SokobanBoard from "./SokobanBoard.vue";
import SokobanToolbar from "./SokobanToolbar.vue";
import { solve } from "@/utils/solver";
import { findPathToCell } from "@/utils/pathFinder";

const props = defineProps<{
  screenRef: HTMLDivElement | null;
}>();

const currentLevelIndex = ref(0);
const movingBlocked = ref(false);
const recordKey = computed(
  () =>
    `own-record-collection-${selectedCollectionIndex.value}-level-${currentLevelIndex.value}`
);

const { time, startTimer, stopTimer, restartTimer } = useTimer();
const { confetti } = useConfetti();
const ownRecord = useLocalStorage(
  recordKey,
  { moves: null as number | null, time: null as number | null },
  { mergeDefaults: true }
);
const { isSwiping, direction } = useSwipe(props.screenRef);

const isLevelSelectorShown = ref(false);
const level = ref<Level>([]);
const title = ref("");
const playerPosition = ref<LevelPosition>({ x: 0, y: 0 });
const moves = ref(0);
const moveHistory = ref<GameState[]>([]);
const gameStatus = ref<"won" | "playing">("playing");
const solutionMode = ref(false);
const mobileMode = ref(true);

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

watch([isSwiping, direction], ([isSw, dir], [wasSw]) => {
  if (!wasSw && isSw && mobileMode && dir !== "none") {
    handleKeyStroke(
      {
        left: "a",
        right: "d",
        up: "w",
        down: "s",
      }[dir]
    );
  }
});

onKeyStroke(true, (event) => {
  handleKeyStroke(event.key);
});

function handleKeyStroke(key: string) {
  if (key === "´") {
    solutionMode.value = true;
    return;
  }

  if (solutionMode.value) {
    solutionMode.value = false;
    switch (key) {
      case "i":
        console.log("Solving with IDA*...");
        const istartTime = performance.now();
        const isolution = solve("ida", level.value);
        const iendTime = performance.now();
        console.log(
          `Solution found in ${(iendTime - istartTime).toFixed(2)}ms:`,
          isolution
        );
        break;
      case "a":
        console.log("Solving with A*...");
        const astartTime = performance.now();
        const asolution = solve("astar", level.value);
        const aendTime = performance.now();
        console.log(
          `Solution found in ${(aendTime - astartTime).toFixed(2)}ms:`,
          asolution
        );
        break;
      case "b":
        console.log("Solving with BFS...");
        const bstartTime = performance.now();
        const bsolution = solve("bfs", level.value);
        const bendTime = performance.now();
        console.log(
          `Solution found in ${(bendTime - bstartTime).toFixed(2)}ms:`,
          bsolution
        );
        break;
      case "d":
        console.log("Solving with DFS...");
        const dstartTime = performance.now();
        const dsolution = solve("dfs", level.value);
        const dendTime = performance.now();
        console.log(
          `Solution found in ${(dendTime - dstartTime).toFixed(2)}ms:`,
          dsolution
        );
        break;
      case "u":
        console.log("Solving with UCS...");
        const ustartTime = performance.now();
        const usolution = solve("ucs", level.value);
        const uendTime = performance.now();
        console.log(
          `Solution found in ${(uendTime - ustartTime).toFixed(2)}ms:`,
          usolution
        );
        break;
    }
  }

  if (isLevelSelectorShown.value) {
    if (key.toLowerCase() === "d" || key === "ArrowRight")
      currentLevelIndex.value++;
    else if (key.toLowerCase() === "a" || key === "ArrowLeft")
      currentLevelIndex.value--;
  }

  if (gameStatus.value === "won") {
    if (key.toLowerCase() === "n" || key === "Enter")
      selectLevel(currentLevelIndex.value + 1);
  }

  const allowedInLvlSelector = ["l", "L", "R", "r", "Escape"];
  const allowedInWinView = ["l", "L", "R", "r"];
  if (isLevelSelectorShown.value && !allowedInLvlSelector.includes(key)) return;
  if (gameStatus.value === "won" && !allowedInWinView.includes(key)) return;
  if (
    movingBlocked.value &&
    (["w", "s", "a", "d", "u", "r"].includes(key.toLowerCase()) ||
      key.startsWith("Arrow"))
  )
    return;

  switch (key) {
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
      if (isLevelSelectorShown.value) startTimer();
      else stopTimer();

      isLevelSelectorShown.value = !isLevelSelectorShown.value;
      break;
    case "Escape":
      isLevelSelectorShown.value = false;
      break;
  }
}

function move(dx: number, dy: number, addToHistory = true) {
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

  if (addToHistory) {
    moveHistory.value.push({
      level: deepCopy(level.value),
      moveCount: moves.value,
      time: time.value,
    });
  }

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

async function autoMoveTo(x: number, y: number) {
  const canPlayerBeHere = [CELL.TARGET, CELL.SPACE].includes(level.value[y][x]);
  if (!canPlayerBeHere) return;

  const path = findPathToCell(level.value, playerPosition.value, x, y);
  if (path.length === 0) return;

  movingBlocked.value = true;
  moveHistory.value.push({
    level: deepCopy(level.value),
    moveCount: moves.value,
    time: time.value,
  });

  const totalTime = 200;
  const stepTime = totalTime / path.length;
  for (const i in path) {
    move(
      path[i] === "RIGHT" ? 1 : path[i] === "LEFT" ? -1 : 0,
      path[i] === "DOWN" ? 1 : path[i] === "UP" ? -1 : 0,
      false
    );
    if (+i < path.length - 1) await wait(stepTime);
  }
  movingBlocked.value = false;
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
    @selectLevel="isLevelSelectorShown = true"
    @next="selectLevel(currentLevelIndex + 1)"
  />
  <div
    v-else
    class="flex flex-col justify-center items-center p-4 sm:p-8 outline-none rounded-xl overflow-hidden"
    tabindex="0"
    ref="boardRef"
  >
    <SokobanStats :moves :time :title />
    <SokobanBoard :level @cell-click="autoMoveTo" />
    <SokobanToolbar />
  </div>
</template>
