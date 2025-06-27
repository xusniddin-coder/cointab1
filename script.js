// Game state
const state = {
  coins: 0,
  level: 1,
  coinsPerTap: 1,
  isPressed: false,
  floatingCoins: [],
  clickEffects: [],
  energy: 0,
  maxEnergy: 2000,
  energyRegenInterval: null,
  energyRegenTimeout: null,
}

// DOM elements
const coinButton = document.getElementById("coin-button")
const coinsDisplay = document.getElementById("coins-display")
const energyDisplay = document.getElementById("energy-display")

// Initialize the game
function init() {
  // LocalStorage'dan coins qiymatini tiklash
  const savedCoins = localStorage.getItem('coins')
  if (savedCoins !== null && !isNaN(Number(savedCoins)) && Number(savedCoins) >= 0) {
    state.coins = parseInt(savedCoins, 10)
  }
  // LocalStorage'dan energy qiymatini tiklash
  const savedEnergy = localStorage.getItem('energy')
  if (savedEnergy !== null) {
    state.energy = parseInt(savedEnergy, 10) || state.maxEnergy
  }
  updateUI()
  // Agar energiya to'liq bo'lmasa, sahifa ochilganda ham regeneratsiyani boshlash
  if (state.energy < state.maxEnergy && !state.energyRegenInterval) {
    startEnergyRegen();
  }
  // Add event listeners
  coinButton.addEventListener("click", handleCoinTap)
  coinButton.addEventListener("touchstart", handleCoinTap, { passive: false })
  coinButton.addEventListener("mousedown", () => {
    state.isPressed = true;
    if (state.energyRegenInterval) {
      clearInterval(state.energyRegenInterval);
      state.energyRegenInterval = null;
    }
    if (state.energyRegenTimeout) {
      clearTimeout(state.energyRegenTimeout);
      state.energyRegenTimeout = null;
    }
  });
  coinButton.addEventListener("touchstart", () => {
    state.isPressed = true;
    if (state.energyRegenInterval) {
      clearInterval(state.energyRegenInterval);
      state.energyRegenInterval = null;
    }
    if (state.energyRegenTimeout) {
      clearTimeout(state.energyRegenTimeout);
      state.energyRegenTimeout = null;
    }
  }, { passive: false });

  coinButton.addEventListener("mouseup", () => {
    state.isPressed = false;
    if (!state.energyRegenTimeout && !state.energyRegenInterval) {
      state.energyRegenTimeout = setTimeout(() => {
        state.energyRegenTimeout = null;
        startEnergyRegen();
      }, 2000);
    }
  });
  coinButton.addEventListener("mouseleave", () => {
    if (state.isPressed) {
      state.isPressed = false;
      if (!state.energyRegenTimeout && !state.energyRegenInterval) {
        state.energyRegenTimeout = setTimeout(() => {
          state.energyRegenTimeout = null;
          startEnergyRegen();
        }, 2000);
      }
    }
  });
  coinButton.addEventListener("touchend", () => {
    state.isPressed = false;
    if (!state.energyRegenTimeout && !state.energyRegenInterval) {
      state.energyRegenTimeout = setTimeout(() => {
        state.energyRegenTimeout = null;
        startEnergyRegen();
      }, 2000);
    }
  });
  coinButton.addEventListener("touchcancel", () => {
    state.isPressed = false;
    if (!state.energyRegenTimeout && !state.energyRegenInterval) {
      state.energyRegenTimeout = setTimeout(() => {
        state.energyRegenTimeout = null;
        startEnergyRegen();
      }, 2000);
    }
  });
}

// Handle coin tap
function showRegisterAlert() {
  let alert = document.getElementById('register-alert');
  if (!alert) {
    alert = document.createElement('div');
    alert.id = 'register-alert';
    alert.style.position = 'fixed';
    alert.style.top = '22px';
    alert.style.left = '50%';
    alert.style.transform = 'translateX(-50%)';
    alert.style.background = 'linear-gradient(90deg,#ffe259,#ffb347,#ff6a00,#ffe259)';
    alert.style.color = '#222';
    alert.style.fontWeight = '800';
    alert.style.fontSize = '1.13rem';
    alert.style.padding = '13px 32px';
    alert.style.borderRadius = '16px';
    alert.style.boxShadow = '0 2px 18px #ffe25955';
    alert.style.zIndex = '9999';
    alert.style.letterSpacing = '0.5px';
    alert.style.textAlign = 'center';
    document.body.appendChild(alert);
  }
  alert.textContent = "Iltimos, ro'yxatdan o'ting bolmasa tanga yiga olmaysz!";
  alert.style.display = 'block';
  if (alert._timeout) clearTimeout(alert._timeout);
  alert._timeout = setTimeout(() => { alert.style.display = 'none'; }, 2000);
}

function handleCoinTap(event) {
  // Faqat ro'yxatdan o'tgan foydalanuvchi coin yiga oladi
  const user = JSON.parse(localStorage.getItem('profileUser'));
  if (!user || !user.nickname) {
    showRegisterAlert();
    return;
  }
  if (state.energy < 1) return;
  // Prevent default behavior for touch events
  if (event.type === "touchstart") {
    event.preventDefault()
  }

  // Energiya regeneratsiyasini to'xtatish
  if (state.energyRegenInterval) {
    clearInterval(state.energyRegenInterval);
    state.energyRegenInterval = null;
  }
  if (state.energyRegenTimeout) {
    clearTimeout(state.energyRegenTimeout);
    state.energyRegenTimeout = null;
  }

  const rect = coinButton.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  // Tangalar qo'shiladi
  state.coins += state.coinsPerTap
  state.energy = Math.max(state.energy - 1, 0);
  updateEnergyUI();
  localStorage.setItem('energy', state.energy)

  // Coin yig'may qo'yilganda 2 sekunddan so'ng regeneratsiya boshlansin
  if (!state.energyRegenTimeout && !state.energyRegenInterval) {
    state.energyRegenTimeout = setTimeout(() => {
      state.energyRegenTimeout = null;
      startEnergyRegen();
    }, 2000);
  }

  // Level oshiriladi
  const newLevel = Math.floor(state.coins / 1000) + 1
  if (newLevel > state.level) {
    state.level = newLevel
    state.coinsPerTap = state.level
  }

  // Vizual effektlar
  pressCoin()
  createFloatingCoin(x, y)
  createClickEffect(x, y)

  // Vibratsiya
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }

  // UI yangilash
  updateUI()
}

// Visual effects
function pressCoin() {
  coinButton.classList.add("pressed")
  setTimeout(() => {
    coinButton.classList.remove("pressed")
  }, 150)
}

function shakeCoin() {
  coinButton.classList.add("shake")
  setTimeout(() => {
    coinButton.classList.remove("shake")
  }, 400)
}

function createFloatingCoin(x, y) {
  const floatingCoin = document.createElement("div")
  floatingCoin.className = "floating-coin"
  floatingCoin.textContent = `+${state.coinsPerTap}`
  floatingCoin.style.position = "fixed"
  floatingCoin.style.left = `${x - 20}px`
  floatingCoin.style.top = `${y - 70}px`

  document.body.appendChild(floatingCoin)

  setTimeout(() => {
    floatingCoin.remove()
  }, 1200)
}

function createClickEffect(x, y) {
  const clickEffect = document.createElement("div")
  clickEffect.className = "click-effect"
  clickEffect.style.position = "fixed"
  clickEffect.style.left = `${x - 32}px`
  clickEffect.style.top = `${y - 70}px`

  document.body.appendChild(clickEffect)

  setTimeout(() => {
    clickEffect.remove()
  }, 800)
}

// Update UI
function updateUI() {
  updateCoinsUI()
  updateEnergyUI()
}

function updateCoinsUI() {
  coinsDisplay.textContent = state.coins.toLocaleString();
  localStorage.setItem('coins', state.coins);
}

function updateEnergyUI() {
  const energyBar = document.getElementById('energy-bar');
  const energyDisplay = document.getElementById('energy-display');
  if (energyBar && energyDisplay) {
    energyDisplay.textContent = state.energy;
    energyBar.style.width = (state.energy / state.maxEnergy * 100) + '%';
    // To'liq ko'rsatkich uchun raqamli ko'rsatkichni yangilash
    const energyText = energyDisplay.parentElement;
    if (energyText) {
      energyText.innerHTML = `<span id="energy-display">${state.energy}</span> / ${state.maxEnergy}`;
    }
  }
}

function startEnergyRegen() {
  if (state.energyRegenInterval) return;
  state.energyRegenInterval = setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energy++;
      updateEnergyUI();
      localStorage.setItem('energy', state.energy)
      if (state.energy >= state.maxEnergy) {
        clearInterval(state.energyRegenInterval);
        state.energyRegenInterval = null;
      }
  } else {
      clearInterval(state.energyRegenInterval);
      state.energyRegenInterval = null;
  }
  }, 300); // 0.3 sekundda 1 energiya
}

// Start the game
document.addEventListener("DOMContentLoaded", init)
