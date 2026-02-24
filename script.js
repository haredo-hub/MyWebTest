const SAVE_KEY = 'vPet_Final_Refactor';
const DECAY_TIME = 12 * 60 * 60 * 1000;

const assets = {
    body: ['assets/body1.png', 'assets/body2.png'],
    eyes: ['assets/eyes1.png', 'assets/eyes2.png'],
    mouth: ['assets/mouth1.png', 'assets/mouth2.png']
};

const sounds = {
    feed: new Audio('assets/feed.mp3'),
    clean: new Audio('assets/sparkle.mp3'),
    coin: new Audio('assets/coin.mp3')
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

// --- AUDIO HELPER ---
function playSound(name) {
    const s = sounds[name];
    if (s && s.readyState >= 2) { // Only play if file exists/loaded
        s.currentTime = 0;
        s.play().catch(() => console.log("Sound blocked by browser"));
    } else {
        console.log("🔊 Triggered sound:", name);
    }
}

// --- MOTION LOGIC ---
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
        alert("Sensors Active!");
    }
}

function handleMotion(e) {
    if (document.getElementById('exercise-screen').classList.contains('hidden')) return;
    let y = e.accelerationIncludingGravity.y;
    
    // Squat threshold logic
    if (phase === 'standing' && y < 5) {
        phase = 'down';
    } else if (phase === 'down' && y > 11.5) {
        phase = 'standing';
        sessionSquats++;
        document.getElementById('squat-count').innerText = sessionSquats;
        
        if (sessionSquats >= 10) {
            pet.coins += 1;
            sessionSquats = 0;
            document.getElementById('squat-count').innerText = "0";
            playSound('coin');
            saveGame();
            updateUI();
        }
    }
}

// --- SWIPE CLEANING ---
function initSwipeCleaning() {
    const petView = document.getElementById('main-pet-view');
    let touchStartX = 0;
    if (!petView) return;

    petView.addEventListener('touchstart', (e) => {
        touchStartX = e.touches.clientX;
    }, { passive: false });

    petView.addEventListener('touchmove', (e) => {
        e.preventDefault(); 
        let currentX = e.touches.clientX;
        if (Math.abs(currentX - touchStartX) > 30) {
            if (!pet.isDead) {
                pet.clean = Math.min(100, pet.clean + 2);
                updateUI();
                touchStartX = currentX; 
                if (Math.floor(pet.clean) % 5 === 0) playSound('clean');
            }
        }
    }, { passive: false });
}

// --- CORE GAME ACTIONS ---
function changePart(type, dir) {
    pet.parts[type] = (pet.parts[type] + dir) % assets[type].length;
    updateVisuals();
}

function updateVisuals() {
    ['preview', 'view'].forEach(p => {
        // Only set background if you have images. Otherwise, fallback CSS applies.
        if (assets.body[0]) document.getElementById(`${p}-body`).style.backgroundImage = `url(${assets.body[pet.parts.body]})`;
        if (assets.eyes[0]) document.getElementById(`${p}-eyes`).style.backgroundImage = `url(${assets.eyes[pet.parts.eyes]})`;
        if (assets.mouth[0]) document.getElementById(`${p}-mouth`).style.backgroundImage = `url(${assets.mouth[pet.parts.mouth]})`;
    });
}

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

function feedPet() {
    if (pet.coins >= 1 && !pet.isDead) {
        pet.coins--;
        pet.fullness = Math.min(100, pet.fullness + 50);
        pet.clean = Math.max(0, pet.clean - 25);
        playSound('feed');
        saveGame();
        updateUI();
    }
}

function startApp() {
    const input = document.getElementById('pet-name-input').value;
    pet.name = input || "Pet";
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    initSwipeCleaning();
    saveGame();
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

function saveGame() {
    pet.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
}

function deleteProgress() { if(confirm("Delete progress?")) { localStorage.removeItem(SAVE_KEY); location.reload(); } }
function openExercise() { document.getElementById('exercise-screen').classList.remove('hidden'); sessionSquats=0; }
function closeExercise() { document.getElementById('exercise-screen').classList.add('hidden'); }

window.onload = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        pet = JSON.parse(saved);
        updateVisuals();
        calculateState();
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        initSwipeCleaning();
        setInterval(calculateState, 10000);
    } else { updateVisuals(); }
};

document.addEventListener('visibilitychange', () => { if(document.hidden) saveGame(); else calculateState(); });
