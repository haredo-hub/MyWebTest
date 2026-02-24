const SAVE_KEY = 'vPet_Pro_Final_v2';
const DECAY_TIME = 12 * 60 * 60 * 1000;

// Update these to match your actual file names
const assets = {
    body: ['assets/body1.png', 'assets/body2.png'],
    eyes: ['assets/eyes1.png', 'assets/eyes2.png'],
    mouth: ['assets/mouth1.png', 'assets/mouth2.png']
};

let pet = {
    name: "Pet",
    parts: { body: 0, eyes: 0, mouth: 0 },
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
// --- SQUAT DETECTION (Filtering shaking) ---
let smoothed = 9.8; 
const filterFactor = 0.1; // Lower = smoother (ignores shaking more)

function handleMotion(e) {
    if (document.getElementById('exercise-screen').classList.contains('hidden')) return;
    if (!e.accelerationIncludingGravity) return;
    
    const ax = e.accelerationIncludingGravity.x || 0;
    const ay = e.accelerationIncludingGravity.y || 0;
    const az = e.accelerationIncludingGravity.z || 0;

    // Use total acceleration magnitude (orientation independent)
    const magnitude = Math.sqrt(ax*ax + ay*ay + az*az);

    // Smooth it
    smoothed = (smoothed * (1 - filterFactor)) + (magnitude * filterFactor);

    /*
      Typical values:
      Standing still ≈ 9.8
      Going down ≈ 7–8
      Pushing up ≈ 11–13
    */

     // Debug output
    document.getElementById("dbg-ax").innerText = ax.toFixed(2);
    document.getElementById("dbg-ay").innerText = ay.toFixed(2);
    document.getElementById("dbg-az").innerText = az.toFixed(2);
    document.getElementById("dbg-mag").innerText = magnitude.toFixed(2);
    document.getElementById("dbg-smooth").innerText = smoothed.toFixed(2);
    document.getElementById("dbg-phase").innerText = phase;
    document.getElementById("dbg-count").innerText = sessionSquats;

    // Squat logic (tune these)
    if (phase === "standing" && smoothed < 8.2) {
        phase = "down";
    }

    if (phase === "down" && smoothed > 11.2) {
        phase = "standing";
        sessionSquats++;
    }

        if (sessionSquats >= 10) {
            pet.coins++;
            sessionSquats = 0;
            document.getElementById("squat-count").innerText = "0";
            saveGame();
            updateUI();
        }
    }

// --- CUSTOMIZATION ---
function changePart(type, dir) {
    if (assets[type]) {
        pet.parts[type] = (pet.parts[type] + dir) % assets[type].length;
        updateVisuals();
    }
}

function updateVisuals() {
    ['preview', 'view'].forEach(p => {
        // Only updates if images are actually present in the folder
        const b = document.getElementById(`${p}-body`);
        const e = document.getElementById(`${p}-eyes`);
        const m = document.getElementById(`${p}-mouth`);
        
        if (assets.body[pet.parts.body]) b.style.backgroundImage = `url(${assets.body[pet.parts.body]})`;
        if (assets.eyes[pet.parts.eyes]) e.style.backgroundImage = `url(${assets.eyes[pet.parts.eyes]})`;
        if (assets.mouth[pet.parts.mouth]) m.style.backgroundImage = `url(${assets.mouth[pet.parts.mouth]})`;
    });
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
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    initSwipe();
    saveGame();
    updateUI();
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
