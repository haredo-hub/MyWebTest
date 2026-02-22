const SAVE_KEY = 'vPet_Squat_Pro';
const DECAY_TIME = 12 * 60 * 60 * 1000; // 12hr Fullness decay

// ASSETS: Replace with your actual paths
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

// 1. MOTION SENSORS (iPhone Fix)
let sessionSquats = 0;
let phase = 'standing';

async function requestMotionPermission() {
    // 1. Check if the browser supports the permission API (iOS 13+)
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            // This MUST be the first line in the click handler
            const permissionState = await DeviceMotionEvent.requestPermission();
            
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotion, true);
                alert("Sensors Active! You can now start squats.");
            } else {
                alert("Permission denied. Enable 'Motion & Orientation' in Safari settings.");
            }
        } catch (error) {
            alert("Error: Please tap the button again directly.");
            console.error(error);
        }
    } else {
        // Android or older iOS
        window.addEventListener('devicemotion', handleMotion, true);
        alert("Sensors active on this device.");
    }
}

// Ensure handleMotion is robust
function handleMotion(e) {
    if (document.getElementById('exercise-screen').classList.contains('hidden')) return;
    
    // Use acceleration INCLUDING gravity for squat detection
    let y = e.accelerationIncludingGravity.y;

    // SENSITIVITY TWEAK:
    // If you are standing still, Y is ~9.8. 
    // When you drop into a squat, Y should fall below 5.
    // When you push back up, Y should spike above 12.
    
    if (phase === 'standing' && y < 5) { 
        phase = 'down'; 
    } else if (phase === 'down' && y > 11.5) { // Threshold for "standing up"
        phase = 'standing';
        sessionSquats++;
        document.getElementById('squat-count').innerText = sessionSquats;
        
        if (sessionSquats >= 10) {
            pet.coins++;
            playSound('coin'); // New sound trigger
            saveGame();
            updateUI();
            sessionSquats = 0;
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
// Add this function to script.js
function initSwipeCleaning() {
    const petView = document.getElementById('main-pet-view');
    let touchStartX = 0;

    // Check if element exists to prevent the crash
    if (!petView) return;

    petView.addEventListener('touchstart', (e) => {
        touchStartX = e.touches.clientX;
    }, { passive: false });

    petView.addEventListener('touchmove', (e) => {
        // Prevent scrolling while cleaning
        e.preventDefault(); 
        
        let currentX = e.touches.clientX;
        let distance = Math.abs(currentX - touchStartX);

        if (distance > 30) {
            if (!pet.isDead) {
                pet.clean = Math.min(100, pet.clean + 2);
                updateUI();
                touchStartX = currentX; 
                
                // Play sound every 5% cleaned
                if (Math.floor(pet.clean) % 5 === 0) playSound('clean');
            }
        }
    }, { passive: false });
}

// UPDATE your startApp function to include the call:
function startApp() {
    const nameInput = document.getElementById('pet-name').value;
    if (!nameInput) return alert("Give your pet a name!");
    
    pet.name = nameInput;
    pet.fullness = 50; // Start at 50%
    pet.clean = 50;    // Start at 50%
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    initSwipeCleaning(); // Start the swipe listener now that screen is visible
    saveGame();
}

// ALSO UPDATE your window.onload to include it for returning users:
window.onload = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        pet = JSON.parse(saved);
        updateVisuals();
        calculateState();
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        initSwipeCleaning(); // Start listener for returning users
        setInterval(calculateState, 10000);
    } else {
        updateVisuals();
    }
};

// Playing sound (SFX)
function playSound(name) {
    // Check if the sound exists and has loaded a source
    if (sounds[name] && sounds[name].src.includes('.mp3')) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(e => {
            // This catches the 'User must click first' browser error
            console.warn("Audio playback blocked or file missing:", name);
        });
    } else {
        // Just log it so you know the logic triggered
        console.log("🔊 Sound Triggered:", name, "(File not found yet)");
    }
}



document.addEventListener('visibilitychange', () => { if(document.hidden) saveGame(); else calculateState(); });
