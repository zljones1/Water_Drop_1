const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const feedbackEl = document.getElementById("feedback");
const restartBtn = document.getElementById("restart");

let drops = [];
let score = 0;
let lives = 5;
let spawnTimer = 0;
let gameOver = false;

function setFeedback(message) {
  feedbackEl.textContent = message;
}

function resetGame() {
  drops = [];
  score = 0;
  lives = 5;
  spawnTimer = 0;
  gameOver = false;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  setFeedback("Tap/click good drops. Avoid polluted drops.");
}

function spawnDrop() {
  const radius = 14 + Math.random() * 10;
  const isBad = Math.random() < 0.28;
  drops.push({
    x: radius + Math.random() * (canvas.width - radius * 2),
    y: -radius,
    radius,
    speed: 1.2 + Math.random() * 2.2,
    bad: isBad,
  });
}

function drawDrop(drop) {
  ctx.beginPath();
  ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
  ctx.fillStyle = drop.bad ? "#7a7a7a" : "#2b98d4";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = drop.bad ? "#4c4c4c" : "#0f6ca8";
  ctx.stroke();
}

function updateDrops() {
  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const drop = drops[i];
    drop.y += drop.speed;

    if (drop.y - drop.radius > canvas.height) {
      drops.splice(i, 1);
      if (!drop.bad) {
        lives -= 1;
        livesEl.textContent = lives;
        setFeedback("Missed a good drop. Be quicker!");
        if (lives <= 0) {
          gameOver = true;
          setFeedback("Game over. Click Restart to try again.");
        }
      }
    }
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drops.forEach(drawDrop);
}

function tick() {
  if (!gameOver) {
    spawnTimer += 1;
    if (spawnTimer >= 36) {
      spawnDrop();
      spawnTimer = 0;
    }
    updateDrops();
  }
  drawScene();
  requestAnimationFrame(tick);
}

function handleClick(event) {
  if (gameOver) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const drop = drops[i];
    const dist = Math.hypot(drop.x - x, drop.y - y);
    if (dist <= drop.radius) {
      drops.splice(i, 1);
      if (drop.bad) {
        score = Math.max(0, score - 5);
        setFeedback("Oops! Polluted drop hit: -5 points.");
      } else {
        score += 10;
        setFeedback("Great catch! +10 points.");
      }
      scoreEl.textContent = score;
      return;
    }
  }
}

restartBtn.addEventListener("click", resetGame);
canvas.addEventListener("click", handleClick);

resetGame();
tick();
