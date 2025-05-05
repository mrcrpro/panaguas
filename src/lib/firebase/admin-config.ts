
import * as admin from 'firebase-admin';

// Ensure environment variables are defined for server-side configuration
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Firebase Admin Error: Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY environment variables.');
    throw new Error('Missing Firebase Admin SDK configuration. Ensure service account credentials are set in environment variables.');
}

// Format the private key correctly (replace escaped newlines)
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            // Optional: If using Realtime Database
            // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin SDK initialization error:', error);
        throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
} else {
    console.log('Firebase Admin SDK already initialized.');
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();
// Export other admin services if needed (e.g., admin.database())

export { firestoreAdmin, authAdmin, admin };
