
import * as admin from 'firebase-admin';

let firestoreAdmin: admin.firestore.Firestore;
let authAdmin: admin.auth.Auth;

try {
    // Ensure environment variables are defined for server-side configuration
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

    const missingVars = [];
    if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKeyEnv) missingVars.push('FIREBASE_PRIVATE_KEY');

    if (missingVars.length > 0) {
        const errorMsg = `Firebase Admin Config Error: Missing required environment variable(s): ${missingVars.join(', ')}.`;
        console.error(errorMsg);
        console.error('Please check your .env.local file or server environment configuration.');
        // Throwing here is appropriate as the Admin SDK cannot function without credentials.
        throw new Error('Missing Firebase Admin SDK configuration credentials.');
    }

    // Format the private key correctly (replace escaped newlines)
    const privateKey = privateKeyEnv.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
        console.log('Initializing Firebase Admin SDK...');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: clientEmail,
                privateKey: privateKey,
            }),
            // Optional: If using Realtime Database
            // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } else {
        console.log('Firebase Admin SDK already initialized.');
    }

    firestoreAdmin = admin.firestore();
    authAdmin = admin.auth();
    console.log("Firestore Admin and Auth Admin services obtained.");

} catch (error: any) {
    console.error('!!! CRITICAL Firebase Admin SDK Initialization Error !!!');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error Message:', error.message);
    if (error.stack) {
         console.error('Error Stack:', error.stack);
    }
    if (error.message.includes('Missing Firebase Admin SDK configuration credentials')) {
         // Message already logged above.
    } else {
        console.error('Ensure your Service Account JSON key is correctly formatted in the FIREBASE_PRIVATE_KEY environment variable, especially newline characters (should be \\\\n).');
        console.error('Verify Project ID and Client Email match the Service Account.');
    }
    // Depending on deployment, might want to prevent app start or handle gracefully
    // For now, we'll re-throw to make the error obvious during development/build
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
}


// Export other admin services if needed (e.g., admin.database())
// Export the initialized services
export { firestoreAdmin, authAdmin, admin };
