let db;
let myTime = 0;
let timerInterval = null;

const request = indexedDB.open("MyDatabase", 1);

// Initialize Database
request.onupgradeneeded = (e) => {
  db = e.target.result;
  db.createObjectStore("settings", { keyPath: "id" });
};

request.onsuccess = (e) => {
  db = e.target.result;
  loadData(); // Load value on page start
};

// Load from DB
function loadData() {
  const transaction = db.transaction(["settings"], "readonly");
  const store = transaction.objectStore("settings");
  const getReq = store.get("lastDateTime");

  getReq.onsuccess = () => {
    if (getReq.result) {
      const savedTime = getReq.result.val;
      const savedDate = getReq.result.date;
      
      // Calculate difference between saved time and current time
      const currentDate = new Date().getTime();
      myTime = savedTime - (currentDate - savedDate);
      
      // Ensure myTime doesn't go negative
      if (myTime < 0) {
        myTime = 0;
      }
      
      document.getElementById('TimeText').innerText = myTime;
      startTimer(); // Start the countdown timer
    }
  };
}

// Save to DB
function saveData() {
  const transaction = db.transaction(["settings"], "readwrite");
  const store = transaction.objectStore("settings");
  
  const currentDate = new Date().getTime();
  store.put({ id: "lastDateTime", val: myTime, date: currentDate });
  
  transaction.oncomplete = () => {
    document.getElementById('lastDateTime').innerText = myTime;
  };
}

// Start the countdown timer
function startTimer() {
  // Clear any existing timer
  if (timerInterval !== null) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    if (myTime > 0) {
      myTime -= 1000;
      document.getElementById('TimeText').innerText = myTime;
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }, 1000);
}

// Save data when user minimizes, switches app, closes tab, or closes app
window.addEventListener('beforeunload', () => {
  saveData();
});

window.addEventListener('pagehide', () => {
  saveData();
});

// For iOS Safari - handle visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveData();
  } else {
    // Resume timer when page becomes visible again
    loadData();
  }
});

function setTenMinutes() {
  myTime = 600000;
  if (timerInterval !== null) {
    clearInterval(timerInterval);
  }
  saveData();
  startTimer();
}
// Add event listener for TenMinButton
TenMinButton.addEventListener('click', setTenMinutes);
