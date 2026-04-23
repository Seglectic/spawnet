const ICONS = {
  play: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.14v13.72c0 .74.8 1.2 1.44.82l10.1-6.86a.95.95 0 0 0 0-1.64L9.44 4.32A.95.95 0 0 0 8 5.14Z"></path>
    </svg>
  `,
  pause: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h4v14H7zm6 0h4v14h-4z"></path>
    </svg>
  `,
  step: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h3v14H6zm5 1.14v11.72c0 .74.8 1.2 1.44.82l8.1-5.86a.95.95 0 0 0 0-1.64l-8.1-5.86a.95.95 0 0 0-1.44.82Z"></path>
    </svg>
  `,
  reset: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5a7 7 0 1 1-6.7 9h2.11A5 5 0 1 0 12 7c-1.38 0-2.63.56-3.54 1.46L11 11H4V4l2.05 2.05A8.96 8.96 0 0 1 12 5Z"></path>
    </svg>
  `,
};

const canvas = document.getElementById("life-canvas");
const ctx = canvas.getContext("2d");

const playButton = document.getElementById("play-toggle");
const stepButton = document.getElementById("step-button");
const resetButton = document.getElementById("reset-button");
const fpsSlider = document.getElementById("fps-slider");
const fpsOutput = document.getElementById("fps-output");
const cellSizeSlider = document.getElementById("cell-size-slider");
const cellSizeOutput = document.getElementById("cell-size-output");

const state = {
  width: 0,
  height: 0,
  cols: 0,
  rows: 0,
  cellSize: Number(cellSizeSlider.value),
  fps: Number(fpsSlider.value),
  playing: true,
  drawing: false,
  drawValue: 1,
  cells: new Uint8Array(),
  next: new Uint8Array(),
  lastTick: 0,
};

function indexOfCell(col, row) {
  return row * state.cols + col;
}

function setButtonIcons() {
  playButton.innerHTML = state.playing ? ICONS.pause : ICONS.play;
  playButton.classList.toggle("is-active", state.playing);
  playButton.setAttribute(
    "aria-label",
    state.playing ? "Pause simulation" : "Play simulation",
  );
  stepButton.innerHTML = ICONS.step;
  resetButton.innerHTML = ICONS.reset;
}

function resizeBoard({ resetPattern = false } = {}) {
  const dpr = window.devicePixelRatio || 1;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const nextCols = Math.max(8, Math.floor(state.width / state.cellSize));
  const nextRows = Math.max(8, Math.floor(state.height / state.cellSize));
  const sizeChanged = nextCols !== state.cols || nextRows !== state.rows;

  if (!sizeChanged && !resetPattern) {
    draw();
    return;
  }

  state.cols = nextCols;
  state.rows = nextRows;
  state.cells = new Uint8Array(state.cols * state.rows);
  state.next = new Uint8Array(state.cols * state.rows);
  seedHelloWord();
  draw();
}

function seedHelloWord() {
  state.cells.fill(0);

  const offscreen = document.createElement("canvas");
  const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
  offscreen.width = state.cols;
  offscreen.height = state.rows;

  offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
  offCtx.fillStyle = "#ffffff";
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";
  let fontSize = Math.max(12, Math.floor(Math.min(state.cols * 0.11, state.rows * 0.52)));
  do {
    offCtx.font = `900 ${fontSize}px "Arial Black", "Segoe UI", sans-serif`;
    fontSize -= 1;
  } while (fontSize > 12 && offCtx.measureText("HELLO WORLD").width > state.cols * 0.9);

  offCtx.font = `900 ${fontSize}px "Arial Black", "Segoe UI", sans-serif`;
  offCtx.fillText("HELLO WORLD", state.cols / 2, state.rows / 2);

  const pixels = offCtx.getImageData(0, 0, state.cols, state.rows).data;
  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const alpha = pixels[(row * state.cols + col) * 4 + 3];
      if (alpha > 64) {
        state.cells[indexOfCell(col, row)] = 1;
      }
    }
  }
}

function countNeighbors(col, row) {
  let total = 0;
  for (let y = -1; y <= 1; y += 1) {
    for (let x = -1; x <= 1; x += 1) {
      if (x === 0 && y === 0) {
        continue;
      }
      const nextCol = (col + x + state.cols) % state.cols;
      const nextRow = (row + y + state.rows) % state.rows;
      total += state.cells[indexOfCell(nextCol, nextRow)];
    }
  }
  return total;
}

function stepSimulation() {
  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const index = indexOfCell(col, row);
      const alive = state.cells[index] === 1;
      const neighbors = countNeighbors(col, row);
      state.next[index] = neighbors === 3 || (alive && neighbors === 2) ? 1 : 0;
    }
  }

  [state.cells, state.next] = [state.next, state.cells];
}

function drawGrid() {
  ctx.strokeStyle = "rgba(88, 101, 242, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= state.cols; x += 1) {
    const xPos = Math.round(x * state.cellSize) + 0.5;
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, state.rows * state.cellSize);
  }

  for (let y = 0; y <= state.rows; y += 1) {
    const yPos = Math.round(y * state.cellSize) + 0.5;
    ctx.moveTo(0, yPos);
    ctx.lineTo(state.cols * state.cellSize, yPos);
  }

  ctx.stroke();
}

function drawCells() {
  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      if (!state.cells[indexOfCell(col, row)]) {
        continue;
      }

      const x = col * state.cellSize;
      const y = row * state.cellSize;
      const gradient = ctx.createLinearGradient(x, y, x + state.cellSize, y + state.cellSize);
      gradient.addColorStop(0, "#57f287");
      gradient.addColorStop(1, "#6ea7ff");
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 1, y + 1, state.cellSize - 1, state.cellSize - 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#111317";
  ctx.fillRect(0, 0, state.width, state.height);
  drawGrid();
  drawCells();
}

function animate(timestamp) {
  const frameLength = 1000 / state.fps;
  if (state.playing && timestamp - state.lastTick >= frameLength) {
    stepSimulation();
    state.lastTick = timestamp;
  }

  draw();
  window.requestAnimationFrame(animate);
}

function eventToCell(event) {
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((event.clientX - rect.left) / state.cellSize);
  const row = Math.floor((event.clientY - rect.top) / state.cellSize);

  if (col < 0 || row < 0 || col >= state.cols || row >= state.rows) {
    return null;
  }

  return { col, row };
}

function paintFromEvent(event) {
  const cell = eventToCell(event);
  if (!cell) {
    return;
  }
  state.cells[indexOfCell(cell.col, cell.row)] = state.drawValue;
}

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }

  const cell = eventToCell(event);
  if (!cell) {
    return;
  }

  const index = indexOfCell(cell.col, cell.row);
  state.drawValue = state.cells[index] ? 0 : 1;
  state.drawing = true;
  canvas.setPointerCapture(event.pointerId);
  state.cells[index] = state.drawValue;
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.drawing) {
    return;
  }
  paintFromEvent(event);
});

canvas.addEventListener("pointerup", (event) => {
  if (state.drawing) {
    canvas.releasePointerCapture(event.pointerId);
  }
  state.drawing = false;
});

canvas.addEventListener("pointerleave", () => {
  state.drawing = false;
});

playButton.addEventListener("click", () => {
  state.playing = !state.playing;
  setButtonIcons();
});

stepButton.addEventListener("click", () => {
  if (state.playing) {
    return;
  }
  stepSimulation();
  draw();
});

resetButton.addEventListener("click", () => {
  seedHelloWord();
  draw();
});

fpsSlider.addEventListener("input", () => {
  state.fps = Number(fpsSlider.value);
  fpsOutput.value = String(state.fps);
});

cellSizeSlider.addEventListener("input", () => {
  state.cellSize = Number(cellSizeSlider.value);
  cellSizeOutput.value = String(state.cellSize);
  resizeBoard({ resetPattern: true });
});

window.addEventListener("resize", () => resizeBoard({ resetPattern: true }));

fpsOutput.value = fpsSlider.value;
cellSizeOutput.value = cellSizeSlider.value;
setButtonIcons();
resizeBoard({ resetPattern: true });
window.requestAnimationFrame(animate);
