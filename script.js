const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const timeEl = document.getElementById('time');
const messageEl = document.getElementById('message');
const gameArea = document.getElementById('gameArea');
const startButton = document.getElementById('startButton');

const INITIAL_LIVES = 3;
const ROUND_SECONDS = 60;
const SPAWN_INTERVAL_MS = 550;
const BAD_DROP_CHANCE = 0.25;
const BAD_SCORE_PENALTY = 2;
const DROP_MIN_SPEED = 120;
const DROP_SPEED_RANGE = 140;
const SPAWN_INTERVAL_SECONDS = SPAWN_INTERVAL_MS / 1000;
const MAX_FRAME_DELTA_SECONDS = 0.1;
const DROP_WIDTH = 44;
const DROP_HEIGHT = 50;
const POINTER_CATCH_RADIUS = 52;

const game = {
  score: 0,
  lives: INITIAL_LIVES,
  timeLeft: ROUND_SECONDS,
  active: false,
  drops: [],
  animationId: null,
  lastFrame: 0,
  elapsedTime: 0,
  spawnElapsed: 0,
};

function setMessage(text) {
  messageEl.textContent = text;
}

function updateHud() {
  scoreEl.textContent = String(game.score);
  livesEl.textContent = String(game.lives);
  timeEl.textContent = String(game.timeLeft);
}

function clampScore() {
  if (game.score < 0) {
    game.score = 0;
  }
}

function createDrop() {
  const isBad = Math.random() < BAD_DROP_CHANCE;
  const drop = document.createElement('button');
  drop.type = 'button';
  drop.className = `drop ${isBad ? 'bad' : 'good'}`;
  drop.setAttribute('aria-label', isBad ? 'Pollutant drop' : 'Water drop');

  const maxX = Math.max(0, gameArea.clientWidth - DROP_WIDTH);
  const x = Math.random() * maxX;
  const speed = DROP_MIN_SPEED + Math.random() * DROP_SPEED_RANGE;

  const data = {
    el: drop,
    x,
    y: -DROP_HEIGHT,
    speed,
    isBad,
    removed: false,
  };

  drop.style.left = `${x}px`;
  drop.style.top = `-${DROP_HEIGHT}px`;

  drop.addEventListener('click', () => onDropClick(data), { once: true });

  gameArea.appendChild(drop);
  game.drops.push(data);
}

function removeDrop(dropData) {
  if (dropData.removed) {
    return;
  }

  const idx = game.drops.indexOf(dropData);
  if (idx !== -1) {
    game.drops.splice(idx, 1);
  }
  dropData.removed = true;
  dropData.el.remove();
}

function onDropClick(dropData) {
  if (!game.active || dropData.removed) {
    return;
  }

  if (dropData.isBad) {
    game.score -= BAD_SCORE_PENALTY;
    game.lives -= 1;
    clampScore();
    setMessage('Ouch! You tapped pollution.');
  } else {
    game.score += 1;
    setMessage('Great catch!');
  }

  updateHud();
  removeDrop(dropData);

  if (game.lives <= 0) {
    endGame('Game over! You ran out of lives.');
  }
}

function findClosestDrop(x, y, maxDistance) {
  let closestDrop = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const drop of game.drops) {
    if (drop.removed) {
      continue;
    }

    const centerX = drop.x + DROP_WIDTH / 2;
    const centerY = drop.y + DROP_HEIGHT / 2;
    const distance = Math.hypot(centerX - x, centerY - y);

    if (distance <= maxDistance && distance < closestDistance) {
      closestDrop = drop;
      closestDistance = distance;
    }
  }

  return closestDrop;
}

function onGameAreaPointerDown(event) {
  if (!game.active) {
    return;
  }

  if (event.target instanceof Element && event.target.classList.contains('drop')) {
    return;
  }

  const rect = gameArea.getBoundingClientRect();
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const closestDrop = findClosestDrop(pointerX, pointerY, POINTER_CATCH_RADIUS);

  if (closestDrop) {
    onDropClick(closestDrop);
  }
}

function updateDrops(deltaSeconds) {
  for (let i = game.drops.length - 1; i >= 0; i -= 1) {
    const drop = game.drops[i];
    drop.y += drop.speed * deltaSeconds;
    drop.el.style.top = `${drop.y}px`;

    if (drop.y > gameArea.clientHeight) {
      if (!drop.isBad) {
        game.lives -= 1;
        setMessage('Missed a clean drop!');
      }
      removeDrop(drop);
      updateHud();

      if (game.lives <= 0) {
        endGame('Game over! You ran out of lives.');
        return;
      }
    }
  }
}

function loop(timestamp) {
  if (!game.active) {
    return;
  }

  const rawDeltaSeconds = (timestamp - game.lastFrame) / 1000;
  const deltaSeconds = Math.min(rawDeltaSeconds, MAX_FRAME_DELTA_SECONDS);
  game.lastFrame = timestamp;

  game.elapsedTime += deltaSeconds;
  game.spawnElapsed += deltaSeconds;

  while (game.spawnElapsed >= SPAWN_INTERVAL_SECONDS) {
    createDrop();
    game.spawnElapsed -= SPAWN_INTERVAL_SECONDS;
  }

  const remainingMs = Math.max(0, ROUND_SECONDS * 1000 - game.elapsedTime * 1000);
  const nextTimeLeft = Math.floor(remainingMs / 1000);
  if (nextTimeLeft !== game.timeLeft) {
    game.timeLeft = nextTimeLeft;
    updateHud();
  }

  if (game.elapsedTime >= ROUND_SECONDS) {
    endGame('Time is up!');
    return;
  }

  updateDrops(deltaSeconds);
  game.animationId = requestAnimationFrame(loop);
}

function clearAllDrops() {
  game.drops.forEach((d) => d.el.remove());
  game.drops = [];
}

function endGame(finalMessage) {
  game.active = false;
  cancelAnimationFrame(game.animationId);
  clearAllDrops();
  setMessage(`${finalMessage} Final score: ${game.score}.`);
  startButton.disabled = false;
  startButton.textContent = 'Play Again';
}

function startGame() {
  cancelAnimationFrame(game.animationId);

  game.score = 0;
  game.lives = INITIAL_LIVES;
  game.timeLeft = ROUND_SECONDS;
  game.active = true;
  game.lastFrame = performance.now();
  game.elapsedTime = 0;
  game.spawnElapsed = 0;

  clearAllDrops();
  updateHud();
  setMessage('Catch clean drops. Avoid brown pollutant drops!');

  startButton.disabled = true;

  game.animationId = requestAnimationFrame(loop);
}

startButton.addEventListener('click', startGame);
gameArea.addEventListener('pointerdown', onGameAreaPointerDown);
updateHud();
