const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const timeEl = document.getElementById('time');
const messageEl = document.getElementById('message');
const gameArea = document.getElementById('gameArea');
const startButton = document.getElementById('startButton');

const game = {
  score: 0,
  lives: 3,
  timeLeft: 60,
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
  const isBad = Math.random() < 0.25;
  const drop = document.createElement('button');
  drop.type = 'button';
  drop.className = `drop ${isBad ? 'bad' : 'good'}`;
  drop.setAttribute('aria-label', isBad ? 'Pollutant drop' : 'Water drop');

  const maxX = Math.max(0, gameArea.clientWidth - 40);
  const x = Math.random() * maxX;
  const speed = 120 + Math.random() * 140;

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
    game.score -= 2;
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
  game.lives = 3;
  game.timeLeft = 60;
  game.active = true;
  game.lastFrame = 0;

  clearAllDrops();
  updateHud();
  setMessage('Catch clean drops. Avoid brown pollutant drops!');

  startButton.disabled = true;

  game.spawnTimer = setInterval(createDrop, 550);
  game.tickTimer = setInterval(() => {
    if (!game.active) {
      return;
    }

    game.timeLeft -= 1;
    updateHud();

    if (game.timeLeft <= 0) {
      endGame('Time is up!');
    }
  }, 1000);

  game.animationId = requestAnimationFrame(loop);
}

startButton.addEventListener('click', startGame);
updateHud();
