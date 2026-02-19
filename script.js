// Configuration
const DECAY_RATE = 1; // Points lost per second
const SAVE_KEY = 'vPet_Data';

let pet = {
    name: "",
    hunger: 100,
    clean: 100,
    lastSaved: Date.now(),
    isActive: false
};

// 1. INITIALIZE / LOAD DATA
window.onload = () => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
        pet = JSON.parse(savedData);
        calculateOfflineProgress();
        showGameScreen();
        startTimers();
    }
};

function startApp() {
    const nameInput = document.getElementById('pet-name-input').value;
    if (!nameInput) return alert("Please name your pet!");
    
    pet.name = nameInput;
    pet.isActive = true;
    pet.lastSaved = Date.now();
    
    showGameScreen();
    startTimers();
    saveGame();
}

// 2. TIME CALCULATIONS
function calculateOfflineProgress() {
    const now = Date.now();
    const secondsPassed = Math.floor((now - pet.lastSaved) / 1000);
    
    // Apply decay for the time user was away
    pet.hunger = Math.max(0, pet.hunger - (secondsPassed * DECAY_RATE));
    pet.clean = Math.max(0, pet.clean - (secondsPassed * DECAY_RATE));
    
    updateUI();
}

function startTimers() {
    setInterval(() => {
        if (pet.isActive) {
            pet.hunger = Math.max(0, pet.hunger - DECAY_RATE);
            pet.clean = Math.max(0, pet.clean - DECAY_RATE);
            updateUI();
        }
    }, 1000);
}

// 3. ACTIONS
function feedPet() {
    pet.hunger = Math.min(100, pet.hunger + 20);
    updateUI();
    saveGame();
}

function cleanPet() {
    pet.clean = Math.min(100, pet.clean + 20);
    updateUI();
    saveGame();
}

// 4. UI & STORAGE
function updateUI() {
    document.getElementById('display-name').innerText = pet.name;
    document.getElementById('hunger-val').innerText = pet.hunger;
    document.getElementById('clean-val').innerText = pet.clean;
    
    // Visual feedback for pet health
    const emoji = document.getElementById('pet-emoji');
    if (pet.hunger < 20) emoji.innerText = "🪦";
    else if (pet.hunger < 50) emoji.innerText = "😿";
    else emoji.innerText = "🐱";
}

function showGameScreen() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
}

function saveGame() {
    pet.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
}

// 5. AUTO-SAVE ON APP SWITCH/CLOSE
// Handles minimize, app switch, and tab closing
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveGame();
    } else {
        // Recalculate when user returns
        calculateOfflineProgress();
    }
});

// Backup save for window closure
window.addEventListener('pagehide', saveGame);
