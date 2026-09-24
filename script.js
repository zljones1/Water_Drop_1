const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const speedEl = document.getElementById('speed');
const feedbackEl = document.getElementById('feedback');
const startBtn = document.getElementById('startBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 70,
  width: 40,
  height: 55,
  speed: 7,
};

let keys = { left: false, right: false };
let drops = [];
let score = 0;
let lives = 3;
let running = false;
let dropTimer = 0;
let spawnEvery = 900;
let lastFrame = 0;
let animationId = null;
let activePointerId = null;

function clearDirection() {
  keys.left = false;
  keys.right = false;
}

function clearActivePointerCapture() {
  if (activePointerId === null) return;
  try {
    if (canvas.hasPointerCapture(activePointerId)) {
      canvas.releasePointerCapture(activePointerId);
    }
  } catch {
    // Pointer can already be inactive after interruption.
  }
  activePointerId = null;
}

function resetGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }
  clearActivePointerCapture();
  clearDirection();
  drops = [];
  score = 0;
  lives = 3;
  running = true;
  dropTimer = 0;
  spawnEvery = 900;
  player.x = canvas.width / 2 - player.width / 2;
  lastFrame = performance.now();
  spawnDrop(22);
  feedbackEl.setAttribute('aria-live', 'polite');
  setFeedback('Game started! Collect clean drops and avoid pollutants.');
  updateHud();
  render();
  animationId = requestAnimationFrame(loop);
}

function setFeedback(msg) {
  feedbackEl.textContent = msg;
}

function updateHud() {
  scoreEl.textContent = String(score);
  livesEl.textContent = String(lives);
  speedEl.textContent = `${(900 / spawnEvery).toFixed(1)}x`;
}

function spawnDrop(yStart = -20) {
  const radius = 10;
  drops.push({
    x: radius + Math.random() * (canvas.width - radius * 2),
    y: yStart,
    radius,
    vy: 2 + Math.random() * 1.5 + score * 0.02,
    bad: Math.random() < 0.25,
  });
}

function movePlayer(delta) {
  const frameScale = Math.max(0.5, Math.min(2, delta / (1000 / 60)));
  if (keys.left) player.x -= player.speed * frameScale;
  if (keys.right) player.x += player.speed * frameScale;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function intersectsPlayer(drop) {
  return (
    drop.x + drop.radius > player.x &&
    drop.x - drop.radius < player.x + player.width &&
    drop.y + drop.radius > player.y &&
    drop.y - drop.radius < player.y + player.height
  );
}

function updateDrops(delta) {
  dropTimer += delta;
  while (dropTimer >= spawnEvery) {
    spawnDrop();
    dropTimer -= spawnEvery;
    spawnEvery = Math.max(320, spawnEvery - 8);
  }

  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const d = drops[i];
    const frameScale = Math.max(0.5, Math.min(2, delta / (1000 / 60)));
    d.y += d.vy * frameScale;

    if (intersectsPlayer(d)) {
      if (d.bad) {
        score = Math.max(0, score - 3);
        lives -= 1;
        setFeedback('Ouch! Pollutant caught: -3 score and -1 life.');
        if (lives <= 0) {
          drops.splice(i, 1);
          break;
        }
      } else {
        score += 1;
        setFeedback('Nice catch! Keep going.');
      }
      drops.splice(i, 1);
      continue;
    }

    if (d.y - d.radius > canvas.height) {
      if (!d.bad) {
        lives -= 1;
        setFeedback('You missed a clean drop: -1 life.');
        if (lives <= 0) {
          drops.splice(i, 1);
          break;
        }
      }
      drops.splice(i, 1);
    }
  }
}

function drawPlayer() {
  ctx.fillStyle = '#f09d9d';
  ctx.fillRect(player.x + 10, player.y + 15, 20, 35);
  ctx.strokeStyle = '#513737';
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x + 10, player.y + 15, 20, 35);

  ctx.beginPath();
  ctx.arc(player.x + 20, player.y + 10, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#f7c8b8';
  ctx.fill();
  ctx.stroke();

  // Simple wireframe bucket in front of player for clearer game visuals.
  ctx.fillStyle = '#d6d6d6';
  ctx.fillRect(player.x + 4, player.y + 36, 32, 16);
  ctx.strokeStyle = '#5f6a72';
  ctx.strokeRect(player.x + 4, player.y + 36, 32, 16);
  ctx.beginPath();
  ctx.arc(player.x + 20, player.y + 36, 14, Math.PI, 0);
  ctx.stroke();
}

function drawDrops() {
  for (const d of drops) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fillStyle = d.bad ? '#5f6a72' : '#45a6ff';
    ctx.fill();
    ctx.strokeStyle = d.bad ? '#2f3a40' : '#2f6aa6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGround() {
  ctx.fillStyle = '#d4e0b5';
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();
  drawPlayer();
  drawDrops();
}

function gameOver() {
  running = false;
  drops = [];
  feedbackEl.setAttribute('aria-live', 'assertive');
  setFeedback(`Game over! Final score: ${score}. Press Start / Restart.`);
}

function loop(ts) {
  if (!running) return;

  const delta = ts - lastFrame;
  lastFrame = ts;

  movePlayer(delta);
  updateDrops(delta);
  updateHud();
  render();

  if (lives <= 0) {
    gameOver();
    return;
  }

  animationId = requestAnimationFrame(loop);
}

function setDirectionFromPointer(clientX) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  keys.left = x < rect.width / 2;
  keys.right = x >= rect.width / 2;
}

function handleKeyDown(e) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    keys.left = true;
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    keys.right = true;
  }
}

function handleKeyUp(e) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    keys.left = false;
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    keys.right = false;
  }
}

canvas.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('keyup', handleKeyUp);

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !e.isPrimary) {
    return;
  }
  canvas.focus();
  clearActivePointerCapture();
  activePointerId = e.pointerId;
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    activePointerId = null;
    clearDirection();
    return;
  }
  setDirectionFromPointer(e.clientX);
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === activePointerId) {
    setDirectionFromPointer(e.clientX);
  }
});

function releasePointerCapture(e) {
  if (e.pointerId !== activePointerId) {
    return;
  }
  clearActivePointerCapture();
  clearDirection();
}

canvas.addEventListener('pointerup', releasePointerCapture);
canvas.addEventListener('pointercancel', releasePointerCapture);

function bindHoldButton(button, onStart) {
  let activeButtonPointerId = null;
  let suppressNextKeyboardClick = false;

  button.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !e.isPrimary) {
      return;
    }
    canvas.focus();
    activeButtonPointerId = e.pointerId;
    try {
      button.setPointerCapture(e.pointerId);
    } catch {
      activeButtonPointerId = null;
    }
    onStart();
  });
  button.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      onStart();
    }
  });
  const stop = () => clearDirection();
  button.addEventListener('pointerup', (e) => {
    if (e.pointerId !== activeButtonPointerId) return;
    try {
      if (button.hasPointerCapture(activeButtonPointerId)) {
        button.releasePointerCapture(activeButtonPointerId);
      }
    } catch {}
    activeButtonPointerId = null;
    stop();
  });
  button.addEventListener('pointercancel', (e) => {
    if (e.pointerId !== activeButtonPointerId) return;
    try {
      if (button.hasPointerCapture(activeButtonPointerId)) {
        button.releasePointerCapture(activeButtonPointerId);
      }
    } catch {}
    activeButtonPointerId = null;
    stop();
  });
  button.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      stop();
      suppressNextKeyboardClick = true;
    }
  });
  button.addEventListener('click', (e) => {
    // Keyboard Enter triggers a native button click with detail 0.
    if (e.detail === 0) {
      if (suppressNextKeyboardClick) {
        suppressNextKeyboardClick = false;
        return;
      }
      onStart();
      setTimeout(stop, 80);
    }
  });
  button.addEventListener('blur', stop);
}

bindHoldButton(leftBtn, () => {
  keys.left = true;
  keys.right = false;
});

bindHoldButton(rightBtn, () => {
  keys.right = true;
  keys.left = false;
});

let startUsedPointer = false;
startBtn.addEventListener('pointerdown', () => {
  startUsedPointer = true;
});

startBtn.addEventListener('click', (e) => {
  clearDirection();
  if (!startUsedPointer) {
    canvas.focus();
  }
  startUsedPointer = false;
  resetGame();
});

render();
