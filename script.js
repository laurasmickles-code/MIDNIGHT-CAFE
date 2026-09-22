const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const levelEl = document.getElementById("level");
const comboEl = document.getElementById("combo");
const statusEl = document.getElementById("status");

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const resumeBtn = document.getElementById("resumeBtn");
const pauseBtn = document.getElementById("pauseBtn");
const soundBtn = document.getElementById("soundBtn");

const finalScoreEl = document.getElementById("finalScore");
const finalTimeEl = document.getElementById("finalTime");
const newBestEl = document.getElementById("newBest");

let W = 0;
let H = 0;

let gameRunning = false;
let paused = false;
let soundEnabled = true;

let score = 0;
let best = Number(localStorage.getItem("neonDodgeBest")) || 0;
let level = 1;
let combo = 1;

let elapsed = 0;
let spawnTimer = 0;
let orbTimer = 0;

let lastTime = 0;

let shake = 0;

bestEl.textContent = best;

/* ----------------------------------
   INPUT
---------------------------------- */

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(
      e.key.toLowerCase()
    )
  ) {
    e.preventDefault();
  }

  if (e.key === " " && gameRunning) {
    togglePause();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

let mouse = {
  x: 0,
  y: 0,
  active: false
};

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();

  mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);

  mouse.active = true;
});

canvas.addEventListener("mouseleave", () => {
  mouse.active = false;
});

/* ----------------------------------
   AUDIO
---------------------------------- */

let audioCtx = null;

function beep(freq, duration, type = "sine", volume = 0.03) {
  if (!soundEnabled) return;

  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

/* ----------------------------------
   RESIZE
---------------------------------- */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  W = canvas.width;
  H = canvas.height;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  W = rect.width;
  H = rect.height;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ----------------------------------
   PLAYER
---------------------------------- */

const player = {
  x: 0,
  y: 0,

  radius: 13,

  speed: 330,

  trail: []
};

function resetPlayer() {
  player.x = W / 2;
  player.y = H - 80;
  player.trail = [];
}

/* ----------------------------------
   OBJECTS
---------------------------------- */

let hazards = [];
let orbs = [];
let particles = [];
let stars = [];

function createStars() {
  stars = [];

  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 30 + 10,
      alpha: Math.random() * 0.7 + 0.2
    });
  }
}

createStars();

/* ----------------------------------
   PARTICLES
---------------------------------- */

function particleBurst(x, y, amount, type = "normal") {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 130 + 30;

    particles.push({
      x,
      y,

      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,

      life: 1,

      size: Math.random() * 3 + 1,

      type
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    p.vx *= 0.97;
    p.vy *= 0.97;

    p.life -= dt * 1.8;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

/* ----------------------------------
   HAZARDS
---------------------------------- */

function spawnHazard() {
  const size = Math.random() * 13 + 9;

  const speed =
    100 +
    Math.random() * 100 +
    level * 14;

  hazards.push({
    x: Math.random() * (W - size * 2) + size,
    y: -size - 20,

    radius: size,

    speed,

    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - 0.5) * 5,

    sides: Math.floor(Math.random() * 3) + 5
  });
}

function updateHazards(dt) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];

    h.y += h.speed * dt;
    h.rotation += h.rotationSpeed * dt;

    if (h.y > H + h.radius * 2) {
      hazards.splice(i, 1);
    }
  }
}

/* ----------------------------------
   ORBS
---------------------------------- */

function spawnOrb() {
  orbs.push({
    x: Math.random() * (W - 50) + 25,
    y: -20,

    radius: 7,

    speed: 100 + level * 8,

    pulse: Math.random() * Math.PI * 2
  });
}

function updateOrbs(dt) {
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];

    orb.y += orb.speed * dt;
    orb.pulse += dt * 5;

    if (orb.y > H + 30) {
      orbs.splice(i, 1);
    }
  }
}

/* ----------------------------------
   COLLISION
---------------------------------- */

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function checkCollisions() {
  /* Hazards */

  for (const h of hazards) {
    if (
      distance(player, h) <
      player.radius + h.radius - 3
    ) {
      gameOver();
      return;
    }
  }

  /* Orbs */

  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];

    if (
      distance(player, orb) <
      player.radius + orb.radius + 4
    ) {
      collectOrb(i);
    }
  }
}

function collectOrb(index) {
  const orb = orbs[index];

  orbs.splice(index, 1);

  score += 100 * combo;

  combo = Math.min(combo + 1, 12);

  particleBurst(
    orb.x,
    orb.y,
    20,
    "orb"
  );

  shake = 4;

  beep(
    500 + combo * 45,
    0.12,
    "triangle",
    0.045
  );

  updateHUD();
}

/* ----------------------------------
   PLAYER MOVEMENT
---------------------------------- */

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (keys["arrowleft"] || keys["a"]) dx--;
  if (keys["arrowright"] || keys["d"]) dx++;
  if (keys["arrowup"] || keys["w"]) dy--;
  if (keys["arrowdown"] || keys["s"]) dy++;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;
  }

  /* Mouse controls */

  if (mouse.active) {
    const dxMouse = mouse.x - player.x;
    const dyMouse = mouse.y - player.y;

    const distanceMouse = Math.hypot(
      dxMouse,
      dyMouse
    );

    if (distanceMouse > 5) {
      const amount = Math.min(
        player.speed * dt,
        distanceMouse
      );

      player.x +=
        (dxMouse / distanceMouse) * amount;

      player.y +=
        (dyMouse / distanceMouse) * amount;
    }
  }

  /* Keep player inside */

  player.x = Math.max(
    player.radius,
    Math.min(W - player.radius, player.x)
  );

  player.y = Math.max(
    player.radius,
    Math.min(H - player.radius, player.y)
  );

  /* Trail */

  player.trail.push({
    x: player.x,
    y: player.y,
    life: 1
  });

  if (player.trail.length > 12) {
    player.trail.shift();
  }

  for (const point of player.trail) {
    point.life -= dt * 4;
  }
}

/* ----------------------------------
   LEVEL
---------------------------------- */

function updateLevel() {
  const newLevel =
    Math.floor(elapsed / 15) + 1;

  if (newLevel !== level) {
    level = newLevel;

    beep(
      700,
      0.18,
      "square",
      0.035
    );

    particleBurst(
      player.x,
      player.y,
      30,
      "level"
    );
  }
}

/* ----------------------------------
   COMBO
---------------------------------- */

let comboTimer = 0;

function updateCombo(dt) {
  comboTimer -= dt;

  if (comboTimer <= 0) {
    combo = 1;
  }
}

/* ----------------------------------
   DRAWING
---------------------------------- */

function drawBackground() {
  ctx.fillStyle = "#080a16";
  ctx.fillRect(0, 0, W, H);

  /* Stars */

  for (const star of stars) {
    star.y += star.speed * 0.016;

    if (star.y > H) {
      star.y = -5;
      star.x = Math.random() * W;
    }

    ctx.globalAlpha = star.alpha;

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(
      star.x,
      star.y,
      star.size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.globalAlpha = 1;

  /* Grid */

  ctx.strokeStyle = "#ffffff08";
  ctx.lineWidth = 1;

  const gridSize = 40;

  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  /* Trail */

  for (let i = 0; i < player.trail.length; i++) {
    const p = player.trail[i];

    if (p.life <= 0) continue;

    const alpha = (i / player.trail.length) * 0.35;

    ctx.globalAlpha = alpha;

    ctx.fillStyle = "#55eaff";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      3 + i * 0.2,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.globalAlpha = 1;

  /* Glow */

  const gradient = ctx.createRadialGradient(
    player.x,
    player.y,
    1,
    player.x,
    player.y,
    35
  );

  gradient.addColorStop(0, "#55eaff55");
  gradient.addColorStop(1, "#55eaff00");

  ctx.fillStyle = gradient;

  ctx.beginPath();

  ctx.arc(
    player.x,
    player.y,
    35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* Ship */

  ctx.save();

  ctx.translate(player.x, player.y);

  ctx.beginPath();

  ctx.moveTo(0, -17);
  ctx.lineTo(12, 12);
  ctx.lineTo(0, 7);
  ctx.lineTo(-12, 12);

  ctx.closePath();

  ctx.fillStyle = "#55eaff";
  ctx.shadowColor = "#55eaff";
  ctx.shadowBlur = 15;

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#07101b";

  ctx.beginPath();

  ctx.arc(
    0,
    -3,
    4,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}

function drawHazard(h) {
  ctx.save();

  ctx.translate(h.x, h.y);
  ctx.rotate(h.rotation);

  ctx.beginPath();

  for (let i = 0; i < h.sides; i++) {
    const angle =
      (Math.PI * 2 * i) / h.sides;

    const radius =
      h.radius *
      (0.85 + Math.sin(i * 4.3) * 0.15);

    const x =
      Math.cos(angle) * radius;

    const y =
      Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();

  ctx.fillStyle = "#ff426d";

  ctx.shadowColor = "#ff426d";
  ctx.shadowBlur = 14;

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.strokeStyle = "#ff9bb3";
  ctx.lineWidth = 1;

  ctx.stroke();

  ctx.restore();
}

function drawOrb(orb) {
  const pulse =
    Math.sin(orb.pulse) * 2;

  const gradient = ctx.createRadialGradient(
    orb.x,
    orb.y,
    1,
    orb.x,
    orb.y,
    22
  );

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, "#55eaff");
  gradient.addColorStop(1, "#55eaff00");

  ctx.fillStyle = gradient;

  ctx.beginPath();

  ctx.arc(
    orb.x,
    orb.y,
    15 + pulse,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#baf8ff";

  ctx.beginPath();

  ctx.arc(
    orb.x,
    orb.y,
    orb.radius,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(
      0,
      p.life
    );

    if (p.type === "orb") {
      ctx.fillStyle = "#55eaff";
    } else if (p.type === "level") {
      ctx.fillStyle = "#a875ff";
    } else {
      ctx.fillStyle = "#ff426d";
    }

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

/* ----------------------------------
   DRAW
---------------------------------- */

function draw() {
  ctx.save();

  if (shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    );
  }

  drawBackground();

  for (const orb of orbs) {
    drawOrb(orb);
  }

  for (const hazard of hazards) {
    drawHazard(hazard);
  }

  drawParticles();

  if (gameRunning) {
    drawPlayer();
  }

  ctx.restore();

  if (shake > 0) {
    shake *= 0.85;

    if (shake < 0.2) {
      shake = 0;
    }
  }
}

/* ----------------------------------
   GAME LOOP
---------------------------------- */

function loop(timestamp) {
  const dt = Math.min(
    (timestamp - lastTime) / 1000,
    0.05
  );

  lastTime = timestamp;

  if (
    gameRunning &&
    !paused
  ) {
    elapsed += dt;

    spawnTimer += dt;
    orbTimer += dt;

    /* Spawn more hazards as level rises */

    const spawnRate =
      Math.max(
        0.18,
        0.8 - level * 0.045
      );

    if (spawnTimer >= spawnRate) {
      spawnTimer = 0;
      spawnHazard();

      if (Math.random() < level * 0.025) {
        spawnHazard();
      }
    }

    if (orbTimer >= 1.2) {
      orbTimer = 0;
      spawnOrb();
    }

    updatePlayer(dt);
    updateHazards(dt);
    updateOrbs(dt);
    updateParticles(dt);

    updateLevel();
    updateCombo(dt);

    checkCollisions();

    score += dt * (5 + level);

    updateHUD();
  }

  draw();

  requestAnimationFrame(loop);
}

/* ----------------------------------
   HUD
---------------------------------- */

function updateHUD() {
  scoreEl.textContent =
    Math.floor(score);

  levelEl.textContent =
    level;

  comboEl.textContent =
    "x" + combo;
}

/* ----------------------------------
   START
---------------------------------- */

function startGame() {
  gameRunning = true;
  paused = false;

  score = 0;
  level = 1;
  combo = 1;

  elapsed = 0;

  spawnTimer = 0;
  orbTimer = 0;

  hazards = [];
  orbs = [];
  particles = [];

  resetPlayer();

  startScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  pauseBtn.textContent = "PAUSE";

  statusEl.textContent =
    "SYSTEM ONLINE";

  beep(
    420,
    0.12,
    "square",
    0.03
  );

  setTimeout(() => {
    beep(
      650,
      0.18,
      "square",
      0.03
    );
  }, 100);

  updateHUD();
}

/* ----------------------------------
   PAUSE
---------------------------------- */

function togglePause() {
  if (!gameRunning) return;

  paused = !paused;

  if (paused) {
    pauseScreen.classList.remove("hidden");

    pauseBtn.textContent = "RESUME";

    statusEl.textContent =
      "SYSTEM PAUSED";
  } else {
    pauseScreen.classList.add("hidden");

    pauseBtn.textContent = "PAUSE";

    statusEl.textContent =
      "SYSTEM ONLINE";

    lastTime = performance.now();
  }
}

/* ----------------------------------
   GAME OVER
---------------------------------- */

function gameOver() {
  gameRunning = false;

  particleBurst(
    player.x,
    player.y,
    55,
    "danger"
  );

  shake = 16;

  beep(
    100,
    0.45,
    "sawtooth",
    0.045
  );

  const finalScore =
    Math.floor(score);

  const wasBest =
    finalScore > best;

  if (wasBest) {
    best = finalScore;

    localStorage.setItem(
      "neonDodgeBest",
      best
    );
  }

  finalScoreEl.textContent =
    finalScore;

  finalTimeEl.textContent =
    Math.floor(elapsed);

  newBestEl.classList.toggle(
    "hidden",
    !wasBest
  );

  bestEl.textContent =
    best;

  statusEl.textContent =
    "SYSTEM OFFLINE";

  gameOverScreen.classList.remove(
    "hidden"
  );
}

/* ----------------------------------
   BUTTONS
---------------------------------- */

startBtn.addEventListener(
  "click",
  startGame
);

restartBtn.addEventListener(
  "click",
  startGame
);

resumeBtn.addEventListener(
  "click",
  togglePause
);

pauseBtn.addEventListener(
  "click",
  togglePause
);

soundBtn.addEventListener(
  "click",
  () => {
    soundEnabled = !soundEnabled;

    soundBtn.textContent =
      soundEnabled ? "🔊" : "🔇";

    if (soundEnabled) {
      beep(
        600,
        0.1,
        "sine",
        0.03
      );
    }
  }
);

/* ----------------------------------
   INITIALIZE
---------------------------------- */

requestAnimationFrame(loop);