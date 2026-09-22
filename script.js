/* =========================================================
   MIDNIGHT CAFÉ
   A small vanilla JavaScript management game
========================================================= */


/* =========================================================
   DOM
========================================================= */

const moneyEl =
  document.getElementById("money");

const dayEl =
  document.getElementById("day");

const timeEl =
  document.getElementById("time");

const reputationEl =
  document.getElementById("reputation");

const comboEl =
  document.getElementById("combo");

const customersEl =
  document.getElementById("customers");

const customerCountEl =
  document.getElementById("customerCount");

const emptyCustomersEl =
  document.getElementById("emptyCustomers");

const currentOrderEl =
  document.getElementById("currentOrder");

const selectedCustomerEl =
  document.getElementById("selectedCustomer");

const orderStatusEl =
  document.getElementById("orderStatus");

const serveButton =
  document.getElementById("serveButton");

const clearButton =
  document.getElementById("clearButton");

const logEl =
  document.getElementById("log");

const soundButton =
  document.getElementById("soundButton");

const helpButton =
  document.getElementById("helpButton");

const helpOverlay =
  document.getElementById("helpOverlay");

const closeHelp =
  document.getElementById("closeHelp");

const dayOverlay =
  document.getElementById("dayOverlay");

const nextDayButton =
  document.getElementById("nextDayButton");

const summaryRevenue =
  document.getElementById("summaryRevenue");

const summaryCustomers =
  document.getElementById("summaryCustomers");

const summaryRep =
  document.getElementById("summaryRep");


/* =========================================================
   GAME DATA
========================================================= */

const MENU = {

  burger: {
    name: "Burger",
    icon: "🍔",
    price: 7
  },

  fries: {
    name: "Fries",
    icon: "🍟",
    price: 4
  },

  cake: {
    name: "Cake",
    icon: "🍰",
    price: 6
  },

  pancakes: {
    name: "Pancakes",
    icon: "🥞",
    price: 8
  },

  coffee: {
    name: "Coffee",
    icon: "☕",
    price: 4
  },

  tea: {
    name: "Tea",
    icon: "🍵",
    price: 3
  },

  soda: {
    name: "Soda",
    icon: "🥤",
    price: 3
  },

  juice: {
    name: "Juice",
    icon: "🧃",
    price: 5
  }

};


const CUSTOMER_TYPES = [

  {
    name: "Sleepy Student",
    face: "😴",
    patience: 100,
    tip: 1
  },

  {
    name: "Night Owl",
    face: "🦉",
    patience: 85,
    tip: 1.2
  },

  {
    name: "Business Person",
    face: "🧑‍💼",
    patience: 75,
    tip: 1.5
  },

  {
    name: "Artist",
    face: "🎨",
    patience: 110,
    tip: 1.1
  },

  {
    name: "Mysterious Stranger",
    face: "🕵️",
    patience: 65,
    tip: 2
  },

  {
    name: "Grandma",
    face: "👵",
    patience: 130,
    tip: 1.4
  },

  {
    name: "Cat Person",
    face: "🐱",
    patience: 95,
    tip: 1.3
  }

];


/* =========================================================
   STATE
========================================================= */

let game = {

  day: 1,

  money: 20,

  reputation: 50,

  combo: 0,

  time: 0,

  dayLength: 90,

  customersServed: 0,

  revenueToday: 0,

  sound: true,

  selectedCustomer: null,

  selectedOrder: [],

  customers: [],

  upgrades: {

    patience: 0,

    tips: 0,

    speed: 0

  }

};


/* =========================================================
   SAVE DATA
========================================================= */

const SAVE_KEY =
  "midnightCafeSave";


function saveGame() {

  const save = {

    day: game.day,

    money: game.money,

    reputation: game.reputation,

    upgrades: game.upgrades

  };

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(save)
  );

}


function loadGame() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(SAVE_KEY)
      );

    if (!saved) return;

    game.day =
      Number(saved.day) || 1;

    game.money =
      Number(saved.money) || 20;

    game.reputation =
      Number(saved.reputation) || 50;

    if (saved.upgrades) {

      game.upgrades = {

        patience:
          Number(saved.upgrades.patience) || 0,

        tips:
          Number(saved.upgrades.tips) || 0,

        speed:
          Number(saved.upgrades.speed) || 0

      };

    }

  } catch {

    console.log(
      "Save data could not be loaded."
    );

  }

}


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;


function beep(
  frequency,
  duration = 0.08,
  type = "sine"
) {

  if (!game.sound) return;

  try {

    if (!audioContext) {

      audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

    }

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.value =
      frequency;

    gain.gain.setValueAtTime(
      0.035,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);

    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime + duration
    );

  } catch {

    /* Audio is optional. */

  }

}


/* =========================================================
   UTILITY
========================================================= */

function random(array) {

  return array[
    Math.floor(
      Math.random() * array.length
    )
  ];

}


function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(max, value)
  );

}


function formatMoney(amount) {

  return "$" +
    Math.floor(amount);

}


/* =========================================================
   LOG
========================================================= */

function log(
  message,
  type = ""
) {

  const entry =
    document.createElement("div");

  entry.className =
    "log-entry " + type;

  entry.textContent =
    "› " + message;

  logEl.prepend(entry);

  while (
    logEl.children.length > 15
  ) {

    logEl.lastChild.remove();

  }

}


/* =========================================================
   CUSTOMER GENERATION
========================================================= */

function generateOrder() {

  const menuKeys =
    Object.keys(MENU);

  const order = [];

  const number =
    Math.random() < 0.65
      ? 2
      : 3;

  while (
    order.length < number
  ) {

    const item =
      random(menuKeys);

    if (
      !order.includes(item)
    ) {

      order.push(item);

    }

  }

  return order;

}


function createCustomer() {

  const type =
    random(CUSTOMER_TYPES);

  const patienceBonus =
    game.upgrades.patience * 15;

  const patience =
    type.patience +
    patienceBonus;

  const customer = {

    id:
      Date.now() +
      Math.random(),

    name: type.name,

    face: type.face,

    patience,

    maxPatience: patience,

    tipMultiplier: type.tip,

    order: generateOrder()

  };

  game.customers.push(
    customer
  );

  log(
    `${customer.face} ${customer.name} walked in.`
  );

  beep(420, .07);

  renderCustomers();

}


/* =========================================================
   CUSTOMER SPAWNING
========================================================= */

function customerLimit() {

  return 3;

}


function spawnCustomersIfNeeded() {

  const limit =
    customerLimit();

  if (
    game.customers.length >= limit
  ) {

    return;

  }

  const baseChance =
    0.004;

  const speedBonus =
    game.upgrades.speed * 0.002;

  const dayBonus =
    game.day * 0.0005;

  const chance =
    baseChance +
    speedBonus +
    dayBonus;

  if (
    Math.random() < chance
  ) {

    createCustomer();

  }

}


/* =========================================================
   SELECT CUSTOMER
========================================================= */

function selectCustomer(id) {

  const customer =
    game.customers.find(
      c => c.id === id
    );

  if (!customer) return;

  game.selectedCustomer =
    customer.id;

  game.selectedOrder =
    [];

  renderCustomers();

  renderOrder();

  beep(550, .06);

}


/* =========================================================
   RENDER CUSTOMERS
========================================================= */

function renderCustomers() {

  customersEl.innerHTML = "";

  customerCountEl.textContent =
    `${game.customers.length} / ${customerLimit()}`;

  emptyCustomersEl.style.display =
    game.customers.length === 0
      ? "block"
      : "none";


  for (
    const customer
    of game.customers
  ) {

    const card =
      document.createElement("div");

    card.className =
      "customer";

    if (
      customer.id ===
      game.selectedCustomer
    ) {

      card.classList.add(
        "selected"
      );

    }


    const top =
      document.createElement("div");

    top.className =
      "customer-top";


    const face =
      document.createElement("div");

    face.className =
      "customer-face";

    face.textContent =
      customer.face;


    const info =
      document.createElement("div");

    info.className =
      "customer-info";


    const name =
      document.createElement("div");

    name.className =
      "customer-name";

    name.textContent =
      customer.name;


    const type =
      document.createElement("div");

    type.className =
      "customer-type";

    type.textContent =
      "wants something";


    info.append(
      name,
      type
    );


    top.append(
      face,
      info
    );


    const patience =
      document.createElement("div");

    patience.className =
      "patience";


    const patienceBar =
      document.createElement("div");

    patienceBar.className =
      "patience-bar";


    const percent =
      clamp(
        customer.patience /
        customer.maxPatience *
        100,
        0,
        100
      );


    patienceBar.style.width =
      percent + "%";


    if (percent < 25) {

      patienceBar.style.background =
        "var(--red)";

    } else if (
      percent < 50
    ) {

      patienceBar.style.background =
        "var(--yellow)";

    }


    patience.append(
      patienceBar
    );


    const miniOrder =
      document.createElement("div");

    miniOrder.className =
      "customer-order-mini";


    miniOrder.textContent =
      customer.order
        .map(
          item =>
            MENU[item].icon
        )
        .join(" ");


    card.append(
      top,
      patience,
      miniOrder
    );


    card.addEventListener(
      "click",
      () =>
        selectCustomer(
          customer.id
        )
    );


    customersEl.appendChild(
      card
    );

  }

}


/* =========================================================
   RENDER ORDER
========================================================= */

function renderOrder() {

  if (
    game.selectedCustomer === null
  ) {

    selectedCustomerEl.textContent =
      "No order selected";

    currentOrderEl.textContent =
      "Select a customer.";

    orderStatusEl.textContent =
      "—";

    serveButton.disabled =
      true;

    return;

  }


  const customer =
    game.customers.find(
      c =>
        c.id ===
        game.selectedCustomer
    );


  if (!customer) {

    game.selectedCustomer =
      null;

    renderOrder();

    return;

  }


  selectedCustomerEl.textContent =
    customer.name;


  currentOrderEl.innerHTML =
    "";


  if (
    game.selectedOrder.length === 0
  ) {

    currentOrderEl.textContent =
      "Choose the items below.";

  } else {

    game.selectedOrder.forEach(
      item => {

        const tag =
          document.createElement("span");

        tag.className =
          "order-item";

        tag.textContent =
          MENU[item].icon +
          " " +
          MENU[item].name;

        currentOrderEl.appendChild(
          tag
        );

      }
    );

  }


  orderStatusEl.textContent =
    `${game.selectedOrder.length}/${customer.order.length}`;

  serveButton.disabled =
    game.selectedOrder.length === 0;

}


/* =========================================================
   ADD FOOD
========================================================= */

function addItem(item) {

  if (
    game.selectedCustomer === null
  ) {

    log(
      "Pick a customer first."
    );

    beep(180, .1, "square");

    return;

  }


  const customer =
    game.customers.find(
      c =>
        c.id ===
        game.selectedCustomer
    );


  if (!customer) return;


  if (
    game.selectedOrder.includes(item)
  ) {

    log(
      `${MENU[item].name} is already in the order.`
    );

    return;

  }


  if (
    game.selectedOrder.length >=
    customer.order.length
  ) {

    log(
      "That's enough food."
    );

    return;

  }


  game.selectedOrder.push(
    item
  );


  beep(
    500 +
    game.selectedOrder.length * 60,
    .06
  );


  renderOrder();

}


/* =========================================================
   CLEAR ORDER
========================================================= */

function clearOrder() {

  game.selectedOrder = [];

  renderOrder();

  beep(250, .05);

}


/* =========================================================
   CHECK ORDER
========================================================= */

function ordersMatch(
  a,
  b
) {

  if (
    a.length !== b.length
  ) {

    return false;

  }


  const sortedA =
    [...a].sort();

  const sortedB =
    [...b].sort();


  return sortedA.every(
    (item, index) =>
      item === sortedB[index]
  );

}


/* =========================================================
   SERVE
========================================================= */

function serveOrder() {

  if (
    game.selectedCustomer === null
  ) {

    return;

  }


  const customer =
    game.customers.find(
      c =>
        c.id ===
        game.selectedCustomer
    );


  if (!customer) return;


  if (
    !ordersMatch(
      game.selectedOrder,
      customer.order
    )
  ) {

    game.combo = 0;

    game.reputation =
      clamp(
        game.reputation - 3,
        0,
        100
      );


    log(
      `${customer.face} Wrong order!`,
      "bad"
    );

    beep(
      130,
      .2,
      "sawtooth"
    );


    customer.patience -= 15;

    clearOrder();

    updateHUD();

    return;

  }


  /* Correct order */

  const basePrice =
    customer.order.reduce(
      (total, item) =>
        total +
        MENU[item].price,
      0
    );


  game.combo++;


  const comboMultiplier =
    1 +
    Math.min(
      game.combo,
      10
    ) * 0.05;


  const tip =
    Math.round(
      basePrice *
      customer.tipMultiplier *
      (0.12 +
       game.upgrades.tips * 0.05)
    );


  const total =
    Math.round(
      basePrice *
      comboMultiplier
    ) +
    tip;


  game.money += total;

  game.revenueToday += total;

  game.customersServed++;


  game.reputation =
    clamp(
      game.reputation + 1,
      0,
      100
    );


  log(
    `${customer.face} Perfect order! +${formatMoney(total)}`,
    "money"
  );


  if (
    game.combo >= 3
  ) {

    log(
      `🔥 ${game.combo}x combo!`
    );

  }


  beep(
    650 +
    Math.min(
      game.combo,
      8
    ) * 40,
    .12,
    "triangle"
  );


  /* Remove customer */

  game.customers =
    game.customers.filter(
      c =>
        c.id !==
        customer.id
    );


  game.selectedCustomer =
    null;

  game.selectedOrder =
    [];


  renderCustomers();

  renderOrder();

  updateHUD();

  saveGame();

}


/* =========================================================
   CUSTOMER PATIENCE
========================================================= */

function updateCustomers(dt) {

  for (
    let i =
      game.customers.length - 1;
    i >= 0;
    i--
  ) {

    const customer =
      game.customers[i];


    let drain =
      2.5 * dt;


    /* Speed upgrade brings
       customers in faster,
       but does not affect patience. */

    customer.patience -=
      drain;


    if (
      customer.patience <= 0
    ) {

      log(
        `${customer.face} ${customer.name} left unhappy.`,
        "bad"
      );


      game.reputation =
        clamp(
          game.reputation - 5,
          0,
          100
        );


      game.combo = 0;


      if (
        game.selectedCustomer ===
        customer.id
      ) {

        game.selectedCustomer =
          null;

        game.selectedOrder =
          [];

      }


      game.customers.splice(
        i,
        1
      );

      beep(
        170,
        .12,
        "square"
      );

    }

  }

}


/* =========================================================
   UPGRADES
========================================================= */

function upgradePrice(
  type
) {

  const level =
    game.upgrades[type];


  const base = {

    patience: 30,

    tips: 40,

    speed: 50

  }[type];


  return Math.round(
    base *
    Math.pow(
      1.7,
      level
    )
  );

}


function buyUpgrade(type) {

  const price =
    upgradePrice(type);


  if (
    game.money < price
  ) {

    log(
      "Not enough money."
    );

    beep(
      150,
      .1,
      "square"
    );

    return;

  }


  game.money -= price;

  game.upgrades[type]++;


  const names = {

    patience:
      "Better Chairs",

    tips:
      "Tip Jar",

    speed:
      "Faster Kitchen"

  };


  log(
    `Purchased ${names[type]}!`,
    "good"
  );


  beep(
    700,
    .12,
    "triangle"
  );


  updateUpgradePrices();

  updateHUD();

  saveGame();

}


/* =========================================================
   UPGRADE PRICE UI
========================================================= */

function updateUpgradePrices() {

  document.getElementById(
    "patiencePrice"
  ).textContent =
    formatMoney(
      upgradePrice("patience")
    );


  document.getElementById(
    "tipsPrice"
  ).textContent =
    formatMoney(
      upgradePrice("tips")
    );


  document.getElementById(
    "speedPrice"
  ).textContent =
    formatMoney(
      upgradePrice("speed")
    );

}


/* =========================================================
   DAY SYSTEM
========================================================= */

function updateDay(dt) {

  game.time += dt;


  if (
    game.time >=
    game.dayLength
  ) {

    finishDay();

  }

}


function finishDay() {

  game.time =
    game.dayLength;


  game.customers =
    [];


  game.selectedCustomer =
    null;


  game.selectedOrder =
    [];


  renderCustomers();

  renderOrder();


  summaryRevenue.textContent =
    formatMoney(
      game.revenueToday
    );


  summaryCustomers.textContent =
    game.customersServed;


  summaryRep.textContent =
    game.reputation;


  dayOverlay.classList.remove(
    "hidden"
  );


  saveGame();


  beep(
    500,
    .2,
    "sine"
  );

}


/* =========================================================
   NEXT DAY
========================================================= */

function nextDay() {

  game.day++;

  game.time = 0;

  game.customersServed = 0;

  game.revenueToday = 0;

  game.combo = 0;

  game.customers = [];

  game.selectedCustomer = null;

  game.selectedOrder = [];


  dayOverlay.classList.add(
    "hidden"
  );


  log(
    `☀️ Day ${game.day} begins.`
  );


  renderCustomers();

  renderOrder();

  updateHUD();

  saveGame();


  beep(
    650,
    .15,
    "triangle"
  );

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  moneyEl.textContent =
    formatMoney(game.money);

  dayEl.textContent =
    game.day;

  reputationEl.textContent =
    game.reputation;

  comboEl.textContent =
    "x" + game.combo;


  const remaining =
    Math.max(
      0,
      game.dayLength -
      game.time
    );


  const minutes =
    Math.floor(
      remaining / 60
    );

  const seconds =
    Math.floor(
      remaining % 60
    );


  timeEl.textContent =
    String(minutes).padStart(
      2,
      "0"
    ) +
    ":" +
    String(seconds).padStart(
      2,
      "0"
    );


  if (
    game.reputation >= 75
  ) {

    reputationEl.style.color =
      "var(--green)";

  } else if (
    game.reputation <= 25
  ) {

    reputationEl.style.color =
      "var(--red)";

  } else {

    reputationEl.style.color =
      "";

  }

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

document
  .querySelectorAll(".food-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        addItem(
          button.dataset.item
        );

      }
    );

  });


document
  .querySelectorAll(".upgrade")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        buyUpgrade(
          button.dataset.upgrade
        );

      }
    );

  });


serveButton.addEventListener(
  "click",
  serveOrder
);


clearButton.addEventListener(
  "click",
  clearOrder
);


nextDayButton.addEventListener(
  "click",
  nextDay
);


/* =========================================================
   HELP
========================================================= */

helpButton.addEventListener(
  "click",
  () => {

    helpOverlay.classList.remove(
      "hidden"
    );

  }
);


closeHelp.addEventListener(
  "click",
  () => {

    helpOverlay.classList.add(
      "hidden"
    );

  }
);


/* =========================================================
   SOUND
========================================================= */

soundButton.addEventListener(
  "click",
  () => {

    game.sound =
      !game.sound;

    soundButton.textContent =
      game.sound
        ? "🔊"
        : "🔇";

    if (game.sound) {

      beep(600, .08);

    }

  }
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      helpOverlay.classList.add(
        "hidden"
      );

    }

    if (
      event.key === "Enter"
    ) {

      if (
        !serveButton.disabled
      ) {

        serveOrder();

      }

    }

  }
);


/* =========================================================
   GAME LOOP
========================================================= */

let lastTime =
  performance.now();


function gameLoop(now) {

  const dt =
    Math.min(
      (now - lastTime) / 1000,
      0.1
    );


  lastTime = now;


  if (
    dayOverlay.classList.contains(
      "hidden"
    )
  ) {

    updateDay(dt);

    updateCustomers(dt);

    spawnCustomersIfNeeded();

    renderCustomers();

    updateHUD();

  }


  requestAnimationFrame(
    gameLoop
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

loadGame();

updateHUD();

updateUpgradePrices();

renderCustomers();

renderOrder();

log(
  "☕ The café is open."
);

log(
  "Someone is probably going to order pancakes."
);

requestAnimationFrame(
  gameLoop
);