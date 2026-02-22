// --- 1. MOTION PERMISSION (iPhone Fix) ---
async function requestMotionPermission() {
    // Check if we are on an iOS device that requires permission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const response = await DeviceMotionEvent.requestPermission();
            if (response === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
                alert("Motion Access Granted!");
                closePermissionModal(); // Hide the button after success
            } else {
                alert("Motion Access Denied. Squats won't work.");
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        // Android or older iOS (no permission needed)
        window.addEventListener('devicemotion', handleMotion);
        alert("Motion active!");
    }
}

// --- 2. SQUAT LOGIC (Android/Coin Fix) ---
function countSquat() {
    sessionSquats++;
    document.getElementById('squat-count').innerText = sessionSquats;

    if (sessionSquats >= 10) {
        // CRITICAL: Update the global pet object directly
        pet.coins += 1; 
        sessionSquats = 0;
        
        // CRITICAL: Immediately update UI and Save
        document.getElementById('squat-count').innerText = "0";
        document.getElementById('coin-val').innerText = pet.coins;
        saveGame(); 
        
        // Optional: Haptic feedback for iPhone
        if (navigator.vibrate) navigator.vibrate(200); 
    }
}

// --- 3. REVISED SAVE FUNCTION ---
function saveGame() {
    pet.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
    console.log("Game Saved. Coins:", pet.coins);
}
