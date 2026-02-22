const SAVE_KEY = 'vPet_Squat_Pro';
const DECAY_TIME = 12 * 60 * 60 * 1000; // 12hr Fullness decay

// ASSETS: Replace with your actual paths
const assets = {
    body: ['assets/body1.png', 'assets/body2.png'],
    eyes: ['assets/eyes1.png', 'assets/eyes2.png'],
    mouth: ['assets/mouth1.png', 'assets/mouth2.png']
};

let pet = {
    name: "Pet",
    parts: { body: 0, eyes: 0, mouth: 0 },
    fullness: 100,
    clean: 100,
    coins: 0,
    birthday: Date.now(),
    lastSaved: Date.now(),
    isDead: false
};

// 1. MOTION SENSORS (iPhone Fix)
let sessionSquats = 0;
let phase = 'standing';

async function requestMotionPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
            alert("Sensors Ready!");
        }
    } else {
        window.addEventListener('devicemotion', handleMotion);
    }
}

function handleMotion(e) {
    if (document.getElementById('exercise-screen').classList.contains('hidden')) return;
    let y = e.accelerationIncludingGravity.y;
    
    if (phase === 'standing' && y < 5) {
        phase = 'down';
    } else if (phase === 'down' && y > 10) {
        phase = 'standing';
        sessionSquats++;
        document.getElementById('squat-count').innerText = sessionSquats;
        
        if (sessionSquats >= 10) {
            pet.coins += 1;
            sessionSquats = 0;
            document.getElementById('squat-count').innerText = "0";
            saveGame();
            updateUI();
            if (navigator.vibrate) navigator.vibrate(200);
        }
    }
}

// 2. PET CUSTOMIZATION
function changePart(type, dir) {
    pet.parts[type] = (pet.parts[type] + dir) % assets[type].length;
    updateVisuals();
}

function updateVisuals() {
    ['preview', 'view'].forEach(p => {
        document.getElementById(`${p}-body`).style.backgroundImage = `url(${assets.body[pet.parts.body]})`;
        document.getElementById(`${p}-eyes`).style.backgroundImage = `url(${assets.eyes[pet.parts.eyes]})`;
        document.getElementById(`${p}-mouth`).style.backgroundImage = `url(${assets.mouth[pet.parts.mouth]})`;
    });
}

// 3. CORE LOOP & SAVING
function calculateState() {
    if (pet.isDead) return;
    const now = Date.now();
    const elapsed = now - pet.lastSaved;
    const loss = (elapsed / DECAY_TIME) * 100;

    pet.fullness = Math.max(0, pet.fullness - loss);
    pet.clean = Math.max(0, pet.clean - (loss * 0.7));
    
    if (pet.fullness <= 0 || pet.clean <= 0) pet.isDead = true;
    updateUI();
}

function saveGame() {
    pet.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
}

function updateUI() {
    document.getElementById('full-val').innerText = Math.floor(pet.fullness);
    document.getElementById('clean-val').innerText = Math.floor(pet.clean);
    document.getElementById('coin-val').innerText = pet.coins;
    
    const age = Math.floor((Date.now() - pet.birthday) / (1000 * 60 * 60 * 24));
    document.getElementById('age-val').innerText = age;

    if (pet.isDead) {
        document.getElementById('death-screen').classList.remove('hidden');
        document.getElementById('death-msg').innerText = pet.name.toUpperCase();
        document.getElementById('final-age').innerText = age;
    }
}

// 4. ACTIONS
function feedPet() {
    if (pet.coins >= 1 && !pet.isDead) {
        pet.coins--;
        pet.fullness = Math.min(100, pet.fullness + 50);
        pet.clean = Math.max(0, pet.clean - 25);
        saveGame();
        updateUI();
    }
}

// Swipe to clean
let sX = 0;
document.getElementById('main-pet-view').addEventListener('touchstart', e => sX = e.touches.clientX);
document.getElementById('main-pet-view').addEventListener('touchmove', e => {
    if (Math.abs(e.touches.clientX - sX) > 30) {
        pet.clean = Math.min(100, pet.clean + 1);
        updateUI();
    }
});

function startApp() {
    pet.name = document.getElementById('pet-name').value || "Pet";
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    saveGame();
}

function deleteProgress() { if(confirm("Restart?")) { localStorage.removeItem(SAVE_KEY); location.reload(); } }
function openExercise() { document.getElementById('exercise-screen').classList.remove('hidden'); sessionSquats=0; }
function closeExercise() { document.getElementById('exercise-screen').classList.add('hidden'); }

// 5. BOOTSTRAP
window.onload = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        pet = JSON.parse(saved);
        updateVisuals();
        calculateState();
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        setInterval(calculateState, 10000);
    } else { updateVisuals(); }
};

document.addEventListener('visibilitychange', () => { if(document.hidden) saveGame(); else calculateState(); });
