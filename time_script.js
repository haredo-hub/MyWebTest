let db;
let myTime = 0
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
        myTime = getReq.result.val;
        document.getElementById('TimeText').innerText = myTime;
      }
    };
  }

  // Save to DB
  function saveData() {
    const transaction = db.transaction(["settings"], "readwrite");
    const store = transaction.objectStore("settings");
    
    store.put({ id: "lastDateTime", val: myTime });
    
    transaction.oncomplete = () => {
      document.getElementById('lastDateTime').innerText = myTime;
    };

  function setTenMinutes() {
    myTime = 600000; 
    saveData()
  };
  }
