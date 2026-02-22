// CONFIGURATION
const SAVE_KEY = 'SquatPet_v1';
const DECAY_TIME = 12 * 60 * 60 * 1000; // 12 hours for 100% loss

// ASSETS (Replace these URLs with your actual GitHub Pages file paths)
const assets = {
    body: ['body1.png', 'body2.png'],
    eyes: ['eyes1.png', 'eyes2.png'],
    mouth: ['mouth1.png', 'mouth2.png']
};

let pet = {
    name: "",
    parts: { body: 0, eyes: 0, mouth: 0 },
    fullness: 100,
    clean: 100,
    coins: 0,
    birthday: Date.now(),
    lastSaved: Date.now(),
    isDead: false
};

// --- 1. SQUAT LOGIC (Physics Based) ---
let squatPhase = 'standing';
let startY = 0;
const SQUAT_THRESHOLD = 3.5; // Distance in m/s² change to count a squat

function initMotion() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission();
    }
    window.addEventListener('devicemotion', handleMotion);
}

function handleMotion(e) {
    if (document.getElementById('exercise-screen').classList.contains('hidden')) return;

    let y = e.accelerationIncludingGravity.y; // Vertical axis

    if (squatPhase === 'standing' && y < 5) {
        squatPhase = 'down';
    } else if (squatPhase === 'down' && y > 10) {
        squatPhase = 'standing';
        countSquat();
    }
}

let sessionSquats = 0;
function countSquat() {
    sessionSquats++;
    document.getElementById('squat-count').innerText = sessionSquats;
    if (sessionSquats >= 10) {
        pet.coins++;
        sessionSquats = 0;
        document.getElementById('squat-count').innerText = "0";
        saveGame();
    }
}

// --- 2. PET CUSTOMIZATION ---
function changePart(type, dir) {
    pet.parts[type] = (pet.parts[type] + dir) % assets[type].length;
    updatePreview();
}

function updatePreview() {
    document.getElementById('layer-body').style.backgroundImage = `url(${assets.body[pet.parts.body]})`;
    document.getElementById('layer-eyes').style.backgroundImage = `url(${assets.eyes[pet.parts.eyes]})`;
    document.getElementById('layer-mouth').style.backgroundImage = `url(${assets.mouth[pet.parts.mouth]})`;
    
    // Also update game view
    document.getElementById('view-body').style.backgroundImage = `url(${assets.body[pet.parts.body]})`;
    document.getElementById('view-eyes').style.backgroundImage = `url(${assets.eyes[pet.parts.eyes]})`;
    document.getElementById('view-mouth').style.backgroundImage = `url(${assets.mouth[pet.parts.mouth]})`;
}

// --- 3. CORE LOOP ---
function calculateState() {
    if (pet.isDead) return;

    const now = Date.now();
    const elapsed = now - pet.lastSaved;
    const loss = (elapsed / DECAY_TIME) * 100;

    pet.fullness = Math.max(0, pet.fullness - loss);
    pet.clean = Math.max(0, pet.clean - (loss * 0.7)); // Cleanness decays a bit slower
    
    // Death Check
    if (pet.fullness <= 0 || pet.clean <= 0) {
        pet.isDead = true;
    }
    
    updateUI();
}

function updateUI() {
    document.getElementById('full-val').innerText = Math.floor(pet.fullness);
    document.getElementById('clean-val').innerText = Math.floor(pet.clean);
    
    const ageDays = Math.floor((Date.now() - pet.birthday) / (1000 * 60 * 60 * 24));
    document.getElementById('age-val').innerText = ageDays;

    if (pet.isDead) {
        document.getElementById('death-screen').classList.remove('hidden');
        document.getElementById('death-msg').innerText = `${pet.name} has passed`;
        document.getElementById('final-age').innerText = ageDays;
    }
}

// --- 4. ACTIONS ---
function feedPet() {
    if (pet.coins > 0 && !pet.isDead) {
        pet.coins--;
        pet.fullness = Math.min(100, pet.fullness + 50);
        pet.clean = Math.max(0, pet.clean - 25);
        saveGame();
        updateUI();
    }
}

// Swipe to clean
let startX = 0;
document.getElementById('main-pet-view').addEventListener('touchstart', e => startX = e.touches[0].clientX);
document.getElementById('main-pet-view').addEventListener('touchmove', e => {
    if (Math.abs(e.touches[0].clientX - startX) > 40) {
        pet.clean = Math.min(100, pet.clean + 1);
        updateUI();
    }
});

// --- 5. SYSTEM ---
function saveGame() {
    pet.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
}

function startApp() {
    pet.name = document.getElementById('pet-name').value || "Unnamed";
    pet.birthday = Date.now();
    pet.lastSaved = Date.now();
    initMotion();
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    saveGame();
}

function deleteProgress() {
    if (confirm("Delete your pet forever?")) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }
}

function openExercise() { document.getElementById('exercise-screen').classList.remove('hidden'); initMotion(); }
function closeExercise() { document.getElementById('exercise-screen').classList.add('hidden'); }

window.onload = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        pet = JSON.parse(saved);
        updatePreview();
        calculateState();
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        setInterval(calculateState, 10000);
    } else {
        updatePreview();
    }
};
