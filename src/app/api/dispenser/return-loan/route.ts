
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin, admin } from '@/lib/firebase/admin-config'; // Import admin for types
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import type { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import specific types

// Define expected request body structure
interface ReturnRequestBody {
    stationId: string;
    // ** Crucial Consideration for Robustness **
    // Ideally, the ESP32 should identify *which* user's umbrella is being returned.
    // Options:
    // 1. User Scans Card Again: ESP32 sends userUid along with stationId. (Simplest if feasible)
    // 2. Unique Umbrella ID: Each umbrella has an ID (QR/NFC tag) read by the station.
    // 3. Slot ID: If the station has numbered slots, the ESP32 sends the slot ID.
    // ---
    // **For this implementation, we'll assume Option 1: userUid is provided.**
    userUid: string;
}

// Define possible response structures
interface ReturnResponseBody {
    success: boolean;
    message: string;
}

// Define Firestore data structures (matching request-loan)
interface UserDoc {
    name?: string;
    email?: string;
    hasActiveLoan?: boolean;
    fineAmount?: number;
    donationTier?: string;
}

interface LoanDoc {
    userId: string;
    stationId: string; // Station where the loan originated
    loanTime: Timestamp; // Expect Timestamp after retrieval
    returnTime?: FieldValue | Timestamp;
    returnedAtStationId?: string; // Add field for return station ID
    isReturned: boolean;
    fineApplied?: boolean;
}

interface StationDoc {
    name?: string;
    location?: string;
    availableUmbrellas?: number;
    capacity?: number; // Ensure capacity is defined
    coords?: admin.firestore.GeoPoint;
    status?: string; // Add status field
}


export async function POST(request: NextRequest) {
    console.log("API Route /api/dispenser/return-loan: Received POST request.");

    // 1. Authenticate the ESP32 device
    if (!authenticateEsp32Request(request)) {
        console.warn("API Route /api/dispenser/return-loan: Unauthorized ESP32 device.");
        return NextResponse.json({ success: false, message: 'Dispositivo no autorizado.' }, { status: 401 });
    }
     console.log("API Route /api/dispenser/return-loan: ESP32 Authenticated.");

    // 2. Parse Request Body
    let body: ReturnRequestBody;
    try {
        body = await request.json();
        // ** Require userUid for reliable return processing **
        if (!body.stationId || !body.userUid) {
            throw new Error('Missing stationId or userUid in request body.');
        }
        console.log("API Route /api/dispenser/return-loan: Request Body Parsed:", body);
    } catch (error) {
        console.error("API Route /api/dispenser/return-loan: Invalid request body.", error);
        return NextResponse.json({ success: false, message: 'Solicitud inválida.' }, { status: 400 });
    }

    const { stationId: returnStationId, userUid } = body; // Rename for clarity

    try {
        // --- Find the active loan for the specific user ---
        console.log(`API Route /api/dispenser/return-loan: Looking for active loan for user ${userUid}.`);
        const activeLoansQuery = firestoreAdmin.collection('loans')
            .where('userId', '==', userUid)
            .where('isReturned', '==', false)
            .limit(1); // A user should only have one active loan

        const querySnapshot = await activeLoansQuery.get();

        if (querySnapshot.empty) {
             console.warn(`API Route /api/dispenser/return-loan: Return failed - No active loan found for user ${userUid}.`);
             // This is a potential issue. Maybe the user tried to return twice?
             // Or the loan wasn't created correctly.
             // Incrementing the station count might be okay if an umbrella was physically returned,
             // but it could lead to count discrepancies if the user had no loan.
             // Let's return an error for now, as this indicates an inconsistent state.
             return NextResponse.json({ success: false, message: 'No tienes un préstamo activo para devolver.' }, { status: 404 }); // Not Found or Bad Request (400)

            /* // Alternative: Attempt to increment station count anyway (use with caution)
             try {
                 const stationDocRef = firestoreAdmin.collection('stations').doc(returnStationId);
                 await stationDocRef.update({ availableUmbrellas: admin.firestore.FieldValue.increment(1) });
                 console.log(`API Route /api/dispenser/return-loan: Incremented umbrella count for station ${returnStationId} even though no matching active loan was found for user ${userUid}.`);
                 return NextResponse.json({ success: true, message: 'Devolución registrada (sin préstamo activo asociado).' }, { status: 200 });
             } catch (stationError) {
                 console.error(`API Route /api/dispenser/return-loan: Error incrementing station ${returnStationId} count after failed loan lookup:`, stationError);
                 return NextResponse.json({ success: false, message: 'Error al actualizar estación.' }, { status: 500 });
             }
            */
        }

        const loanDocSnap = querySnapshot.docs[0];
        const loanData = loanDocSnap.data() as LoanDoc;
        const loanId = loanDocSnap.id;

        console.log(`API Route /api/dispenser/return-loan: Found active loan ${loanId} for user ${userUid}.`);

        // 3. Start Firestore Transaction for Return
         console.log(`API Route /api/dispenser/return-loan: Starting transaction for return of loan ${loanId} at station ${returnStationId}.`);
        await firestoreAdmin.runTransaction(async (transaction) => {
            const loanDocRef = firestoreAdmin.collection('loans').doc(loanId);
            const userDocRef = firestoreAdmin.collection('users').doc(userUid);
            const stationDocRef = firestoreAdmin.collection('stations').doc(returnStationId); // Station where it was returned

            // Get user data for potential fine calculation/tier logic
            const userSnap = await transaction.get(userDocRef);
             const userData = userSnap.exists ? userSnap.data() as UserDoc : null;


             // --- Perform Updates ---
             const returnTimestamp = admin.firestore.FieldValue.serverTimestamp(); // Use server time

             // Calculate fine (if applicable)
             const fineAmount = calculateFine(loanData, userData, returnTimestamp as Timestamp); // Pass expected return time

             console.log(`API Route /api/dispenser/return-loan: Transaction - Calculated fine: ${fineAmount}`);

            // Mark loan as returned
            transaction.update(loanDocRef, {
                isReturned: true,
                returnTime: returnTimestamp,
                returnedAtStationId: returnStationId, // Record where it was returned
                fineApplied: fineAmount > 0,
            });
             console.log(`API Route /api/dispenser/return-loan: Transaction - Loan ${loanId} marked as returned at station ${returnStationId}.`);

            // Update user status
            const userUpdateData: Partial<UserDoc> = { hasActiveLoan: false };
            if (fineAmount > 0) {
                userUpdateData.fineAmount = admin.firestore.FieldValue.increment(fineAmount);
                 console.log(`API Route /api/dispenser/return-loan: Transaction - Adding fine of ${fineAmount} to user ${userUid}.`);
            }
            transaction.update(userDocRef, userUpdateData);
            console.log(`API Route /api/dispenser/return-loan: Transaction - User ${userUid} marked as inactive (no active loan).`);


            // Update station umbrella count (for the station where it was returned)
             // Ensure station exists before incrementing (safety check)
             const stationSnap = await transaction.get(stationDocRef);
             if (stationSnap.exists) {
                transaction.update(stationDocRef, { availableUmbrellas: admin.firestore.FieldValue.increment(1) });
                console.log(`API Route /api/dispenser/return-loan: Transaction - Station ${returnStationId} umbrella count incremented.`);
             } else {
                 // This shouldn't happen if the ESP32 sends a valid ID, but handle defensively.
                 console.warn(`API Route /api/dispenser/return-loan: Station ${returnStationId} not found during return transaction, cannot increment count. This indicates a potential configuration issue.`);
                 // Optionally, throw an error to rollback the transaction if station consistency is critical.
                 // throw new Error(`Return station ${returnStationId} not found.`);
             }
        });

        // 4. Send Success Response
        console.log(`API Route /api/dispenser/return-loan: Return processed successfully for loan ${loanId} at station ${returnStationId}. Sending 200 response.`);
        return NextResponse.json({ success: true, message: 'Devolución exitosa.' }, { status: 200 });

    } catch (error: any) {
        console.error(`API Route /api/dispenser/return-loan: Critical error processing return for user ${userUid} at station ${returnStationId}:`, error);
        // Avoid revealing specific loan/user IDs in generic errors
        return NextResponse.json({ success: false, message: 'Error interno del servidor al procesar devolución.' }, { status: 500 });
    }
}

// --- Fine Calculation Logic ---

// Calculates the allowed loan duration in milliseconds based on donation tier.
function getAllowedDurationMs(donationTier?: string): number {
    const baseDurationHours = 4;
    let bonusHours = 0;

    switch (donationTier?.toLowerCase()) {
        case 'donador menor':
            bonusHours = 0.5; // +30 mins
            break;
        case 'donador medio':
            bonusHours = 1; // +1 hour
            break;
        case 'donador alto':
            bonusHours = 2; // +2 hours
            break;
        default: // Gratuito or undefined
            bonusHours = 0;
            break;
    }
    return (baseDurationHours + bonusHours) * 60 * 60 * 1000; // Convert total hours to ms
}

// Calculates the fine amount based on loan duration vs allowed time.
function calculateFine(loanData: LoanDoc, userData: UserDoc | null, returnTimestamp: Timestamp): number {
    if (!loanData.loanTime || !returnTimestamp) {
        console.warn("API Route /api/dispenser/return-loan: Fine calculation skipped - missing loan or return time.");
        return 0; // Cannot calculate without times
    }

    // Firestore Timestamps need to be converted to JS Dates for calculation
    const loanStartTime = loanData.loanTime.toDate();
    const returnTime = returnTimestamp.toDate(); // Use the actual return time

    const loanDurationMs = returnTime.getTime() - loanStartTime.getTime();
    const allowedDurationMs = getAllowedDurationMs(userData?.donationTier);

    const overdueMs = loanDurationMs - allowedDurationMs;

    if (overdueMs <= 0) {
        console.log("API Route /api/dispenser/return-loan: Loan returned on time.");
        return 0; // No fine
    }

    // --- Define Fine Structure ---
    const finePerOverdueHour = 2000; // Example: $2000 COP per hour (or part thereof)
    const hoursOverdue = Math.ceil(overdueMs / (60 * 60 * 1000)); // Round up to the next hour

    const calculatedFine = hoursOverdue * finePerOverdueHour;
    console.log(`API Route /api/dispenser/return-loan: Loan overdue by ${overdueMs}ms (${hoursOverdue} hours). Fine applied: ${calculatedFine} COP.`);

    // Optional: Add a maximum fine limit
    // const maxFine = 15000;
    // return Math.min(calculatedFine, maxFine);

    return calculatedFine;
}
