import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyhKmfHbiF3rcKbOChLnZOqXp4PjJy_tU",
  authDomain: "viideyy2.firebaseapp.com",
  projectId: "viideyy2",
  storageBucket: "viideyy2.firebasestorage.app",
  messagingSenderId: "708016517478",
  appId: "1:708016517478:web:660a9302e62e9e87fd98a7",
  measurementId: "G-RPEX0R9MK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Simple connection check as requested by system rules
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Firebase client appears to be offline. Verify credentials if problems persist.");
    }
  }
}

testConnection();
