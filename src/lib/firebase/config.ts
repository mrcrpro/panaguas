

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Check for required environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Throw a more specific error if required variables are missing
if (!apiKey || !authDomain || !projectId) {
  // Removed console.error logs as the Error provides the necessary info
  throw new Error(
    "Missing Firebase configuration. Ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables are correctly set in your .env.local file or environment."
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
// Check if Firebase has already been initialized
if (!getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
        console.log("Firebase Client SDK initialized successfully."); // Keep success log
    } catch (error: any) {
        console.error("Firebase Client SDK initialization error:", error); // Keep error log
        throw new Error(`Firebase Client SDK initialization failed: ${error.message}. Please double-check your Firebase project settings and ensure the environment variables (NEXT_PUBLIC_FIREBASE_*) in your .env.local or environment configuration match exactly.`); // Enhanced error
    }
} else {
    app = getApp(); // Get the already initialized app
    // console.log("Firebase Client SDK already initialized."); // Optional: Log if already initialized
}


let auth;
let db;

// Get Firebase services, catching potential errors if initialization failed partially
try {
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error: any) {
     console.error("Error getting Firebase Client services (Auth/Firestore):", error);
     // Rethrow to make the issue clear during development/build.
     throw new Error(`Failed to get Firebase Client services (Auth/Firestore): ${error.message}. This usually indicates a problem with the Firebase App initialization. Check previous logs for details.`);
}


export { app, auth, db };
