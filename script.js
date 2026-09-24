const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const speedEl = document.getElementById('speed');
const feedbackEl = document.getElementById('feedback');
const startBtn = document.getElementById('startBtn');

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

function resetGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }
  drops = [];
  score = 0;
  lives = 3;
  running = true;
  dropTimer = 0;
  spawnEvery = 900;
  player.x = canvas.width / 2 - player.width / 2;
  setFeedback('Collect clean drops. Avoid dark pollutant drops!');
  updateHud();
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

function spawnDrop() {
  drops.push({
    x: Math.random() * (canvas.width - 20),
    y: -20,
    radius: 10,
    vy: 2 + Math.random() * 1.5 + score * 0.02,
    bad: Math.random() < 0.25,
  });
}

function movePlayer() {
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
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
  if (dropTimer >= spawnEvery) {
    spawnDrop();
    dropTimer = 0;
    spawnEvery = Math.max(320, spawnEvery - 8);
  }

  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const d = drops[i];
    d.y += d.vy;

    if (intersectsPlayer(d)) {
      if (d.bad) {
        score = Math.max(0, score - 3);
        lives -= 1;
        setFeedback('Ouch! Pollutant caught: -3 score and -1 life.');
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
      }
      drops.splice(i, 1);
    }
  }
}

function drawPlayer() {
  ctx.fillStyle = '#f09d9d';
  ctx.fillRect(player.x + 10, player.y + 15, 20, 35);
  ctx.beginPath();
  ctx.arc(player.x + 20, player.y + 10, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#f7c8b8';
  ctx.fill();
}

function drawDrops() {
  for (const d of drops) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fillStyle = d.bad ? '#5f6a72' : '#45a6ff';
    ctx.fill();
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
  setFeedback(`Game over! Final score: ${score}. Press Start / Restart.`);
}

function loop(ts) {
  if (!running) return;

  const delta = ts - lastFrame;
  lastFrame = ts;

  movePlayer();
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

canvas.addEventListener('pointerdown', (e) => {
  setDirectionFromPointer(e.clientX);
});

canvas.addEventListener('pointermove', (e) => {
  if (e.buttons > 0) setDirectionFromPointer(e.clientX);
});

canvas.addEventListener('pointerup', () => {
  keys.left = false;
  keys.right = false;
});

startBtn.addEventListener('click', () => {
  lastFrame = performance.now();
  resetGame();
});

render();
