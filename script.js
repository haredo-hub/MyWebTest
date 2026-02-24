const SAVE_KEY = 'vPet_Pro_Final_v1';
const DECAY_TIME = 12 * 60 * 60 * 1000;

let pet = {
    name: "Pet",
    fullness: 50,
    clean: 50,
    coins: 0,
    birthday: Date.now(),
    lastSaved: Date.now(),
    isDead: false
};

// --- MOTION PERMISSION & NAVIGATION ---
function openExercise() {
    document.getElementById('exercise-screen').classList.remove('hidden');
}

function closeExercise() {
    document.getElementById('exercise-screen').classList.add('hidden');
}

async function requestMotionPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const res = await DeviceMotionEvent.requestPermission();
        if (res === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
            alert("Sensors active!");
        }
    } else {
        window.addEventListener('devicemotion', handleMotion);
        alert("Sensors active!");
    }
}

let sessionSquats = 0;
let phase = 'standing';
function handleMotion(e) {
    let y = e.accelerationIncludingGravity.y;
    if (phase === 'standing' && y < 5) phase = 'down';
    else if (phase === 'down' && y > 11.5) {
        phase = 'standing';
        sessionSquats++;
        document.getElementById('squat-count').innerText = sessionSquats;
        if (sessionSquats >= 10) {
            pet.coins++;
            sessionSquats = 0;
            document.getElementById('squat-count').innerText = "0";
            saveGame();
            updateUI();
        }
    }
}

// --- SWIPE CLEANING ---
function initSwipe() {
    const petView = document.getElementById('main-pet-view');
    let startX = 0;
    if (!petView) return;

    petView.addEventListener('touchstart', (e) => startX = e.touches[0].clientX, {passive: false});
    petView.addEventListener('touchmove', (e) => {
        e.preventDefault();
        let curX = e.touches[0].clientX;
        if (Math.abs(curX - startX) > 30) {
            pet.clean = Math.min(100, pet.clean + 2);
            updateUI();
            startX = curX;
        }
    }, {passive: false});
}

// --- CORE FUNCTIONS ---
function startApp() {
    const name = document.getElementById('pet-name-input').value;
    if (!name) return alert("Please name your pet!");
    pet.name = name;
    pet.fullness = 50; // New pets start at 50%
    pet.clean = 50;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    initSwipe();
    saveGame();
}

function updateUI() {
    document.getElementById('full-val').innerText = Math.floor(pet.fullness);
    document.getElementById('clean-val').innerText = Math.floor(pet.clean);
    document.getElementById('coin-val').innerText = pet.coins;
    document.getElementById('age-val').innerText = Math.floor((Date.now() - pet.birthday) / 86400000);
}

function feedPet() {
    if (pet.coins > 0) {
        pet.coins--;
        pet.fullness = Math.min(100, pet.fullness + 50);
        pet.clean = Math.max(0, pet.clean - 25);
        saveGame();
        updateUI();
    } else {
        alert("Not enough coins! Go do some squats.");
    }
}

function deleteProgress() {
    if (confirm("Delete your pet?")) {
        localStorage.removeItem(SAVE_KEY);
        window.location.reload();
    }
}

function saveGame() {
    pet.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
}

function calculateDecay() {
    const elapsed = Date.now() - pet.lastSaved;
    const loss = (elapsed / DECAY_TIME) * 100;
    pet.fullness = Math.max(0, pet.fullness - loss);
    pet.clean = Math.max(0, pet.clean - (loss * 0.7));
    updateUI();
}

window.onload = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        pet = JSON.parse(saved);
        calculateDecay();
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        initSwipe();
        setInterval(calculateDecay, 10000);
    }
};
