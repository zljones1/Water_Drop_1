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

const game = {
  score: 0,
  lives: INITIAL_LIVES,
  timeLeft: ROUND_SECONDS,
  active: false,
  drops: [],
  spawnTimer: null,
  tickTimer: null,
  animationId: null,
  lastFrame: 0,
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

  const maxX = Math.max(0, gameArea.clientWidth - 40);
  const x = Math.random() * maxX;
  const speed = DROP_MIN_SPEED + Math.random() * DROP_SPEED_RANGE;

  const data = {
    el: drop,
    x,
    y: -45,
    speed,
    isBad,
  };

  drop.style.left = `${x}px`;
  drop.style.top = '-45px';

  drop.addEventListener('click', () => onDropClick(data), { once: true });

  gameArea.appendChild(drop);
  game.drops.push(data);
}

function removeDrop(dropData) {
  const idx = game.drops.indexOf(dropData);
  if (idx !== -1) {
    game.drops.splice(idx, 1);
  }
  dropData.el.remove();
}

function onDropClick(dropData) {
  if (!game.active) {
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

  if (!game.lastFrame) {
    game.lastFrame = timestamp;
  }

  const deltaSeconds = (timestamp - game.lastFrame) / 1000;
  game.lastFrame = timestamp;

  updateDrops(deltaSeconds);
  game.animationId = requestAnimationFrame(loop);
}

function clearAllDrops() {
  game.drops.forEach((d) => d.el.remove());
  game.drops = [];
}

function endGame(finalMessage) {
  game.active = false;
  clearInterval(game.spawnTimer);
  clearInterval(game.tickTimer);
  cancelAnimationFrame(game.animationId);
  clearAllDrops();
  setMessage(`${finalMessage} Final score: ${game.score}.`);
  startButton.disabled = false;
  startButton.textContent = 'Play Again';
}

function startGame() {
  game.score = 0;
  game.lives = INITIAL_LIVES;
  game.timeLeft = ROUND_SECONDS;
  game.active = true;
  game.lastFrame = performance.now();

  clearAllDrops();
  updateHud();
  setMessage('Catch clean drops. Avoid brown pollutant drops!');

  startButton.disabled = true;

  game.spawnTimer = setInterval(createDrop, SPAWN_INTERVAL_MS);
  game.tickTimer = setInterval(() => {
    if (!game.active) {
      return;
    }

    game.timeLeft -= 1;
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      updateHud();
      endGame('Time is up!');
      return;
    }

    updateHud();
  }, 1000);

  game.animationId = requestAnimationFrame(loop);
}

startButton.addEventListener('click', startGame);
updateHud();
