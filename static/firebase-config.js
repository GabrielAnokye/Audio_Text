// Initialize Firebase
const firebaseConfig = {};

// Initialize Firebase
try {
  if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}
