let db;

const DB_NAME = 'SmokingTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'smokingData';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject("IndexedDB error: " + event.target.error);

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function addEntry(entry) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(entry);

        request.onerror = (event) => reject("Error adding entry: " + event.target.error);
        request.onsuccess = (event) => resolve(event.target.result);
    });
}

function getAllEntries() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = (event) => reject("Error fetching entries: " + event.target.error);
        request.onsuccess = (event) => resolve(event.target.result);
    });
}

function clearAllEntries() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = (event) => reject("Error clearing entries: " + event.target.error);
        request.onsuccess = (event) => resolve();
    });
}

export { openDB, addEntry, getAllEntries, clearAllEntries };