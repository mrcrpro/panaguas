
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
    donationTier?: string; // Example: 'Gratuito', 'Donador Bajo', 'Donador Medio', 'Donador Alto'
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
             // Note: Firestore server timestamps aren't immediately available in the code.
             // For accurate fine calculation *within* the transaction using server time,
             // it's complex. A common approach is to calculate the fine *after* the transaction
             // based on the committed loanTime and returnTime, or use client-side time
             // (less reliable) or estimate based on request time (also less reliable).
             // For simplicity here, we'll calculate AFTER the transaction based on fetched data.
             // However, this means the 'fineApplied' flag set here might be premature.
             // A more robust solution involves a Cloud Function triggered on loan return.

             // We fetch loanData again *after* the transaction to get the server-generated returnTime
             transaction.update(loanDocRef, {
                isReturned: true,
                returnTime: returnTimestamp,
                returnedAtStationId: returnStationId, // Record where it was returned
                // fineApplied: fineAmount > 0, // We calculate fine *after* transaction for accuracy
            });
             console.log(`API Route /api/dispenser/return-loan: Transaction - Loan ${loanId} marked as returned at station ${returnStationId}.`);

            // Update user status
            const userUpdateData: Partial<UserDoc> = { hasActiveLoan: false };
            // Fine increment happens *after* transaction or via Cloud Function
            // if (fineAmount > 0) {
            //     userUpdateData.fineAmount = admin.firestore.FieldValue.increment(fineAmount);
            //      console.log(`API Route /api/dispenser/return-loan: Transaction - Adding fine of ${fineAmount} to user ${userUid}.`);
            // }
            transaction.update(userDocRef, userUpdateData);
            console.log(`API Route /api/dispenser/return-loan: Transaction - User ${userUid} marked as inactive (no active loan).`);


            // Update station umbrella count (for the station where it was returned)
             // Ensure station exists before incrementing (safety check)
             const stationSnap = await transaction.get(stationDocRef);
             if (stationSnap.exists) {
                 const stationData = stationSnap.data() as StationDoc;
                 // Prevent count exceeding capacity (optional, but good practice)
                 if (typeof stationData.capacity !== 'number' || (stationData.availableUmbrellas ?? 0) < stationData.capacity) {
                    transaction.update(stationDocRef, { availableUmbrellas: admin.firestore.FieldValue.increment(1) });
                    console.log(`API Route /api/dispenser/return-loan: Transaction - Station ${returnStationId} umbrella count incremented.`);
                 } else {
                      console.warn(`API Route /api/dispenser/return-loan: Station ${returnStationId} already at capacity (${stationData.capacity}). Count not incremented.`);
                 }
             } else {
                 // This shouldn't happen if the ESP32 sends a valid ID, but handle defensively.
                 console.warn(`API Route /api/dispenser/return-loan: Station ${returnStationId} not found during return transaction, cannot increment count. This indicates a potential configuration issue.`);
                 // Optionally, throw an error to rollback the transaction if station consistency is critical.
                 // throw new Error(`Return station ${returnStationId} not found.`);
             }
        });
         console.log(`API Route /api/dispenser/return-loan: Transaction completed for loan ${loanId}.`);

        // --- Fine Calculation (After Transaction) ---
        // Fetch the updated loan document to get the server-generated returnTime
        const updatedLoanSnap = await firestoreAdmin.collection('loans').doc(loanId).get();
        if (updatedLoanSnap.exists) {
             const finalLoanData = updatedLoanSnap.data() as LoanDoc;
             const userSnap = await firestoreAdmin.collection('users').doc(userUid).get();
             const userData = userSnap.exists ? userSnap.data() as UserDoc : null;

             if (finalLoanData.returnTime instanceof Timestamp) { // Ensure returnTime is a Timestamp
                const fineAmount = calculateFine(finalLoanData, userData, finalLoanData.returnTime);
                 console.log(`API Route /api/dispenser/return-loan: Post-transaction Fine Calculation - Calculated fine: ${fineAmount}`);

                 // Update loan and user documents with fine info if necessary
                 if (fineAmount > 0) {
                    const loanUpdate: Partial<LoanDoc> = { fineApplied: true };
                    const userUpdate: Partial<UserDoc> = { fineAmount: admin.firestore.FieldValue.increment(fineAmount) };

                    await Promise.all([
                        firestoreAdmin.collection('loans').doc(loanId).update(loanUpdate),
                        firestoreAdmin.collection('users').doc(userUid).update(userUpdate)
                    ]);
                    console.log(`API Route /api/dispenser/return-loan: Applied fine of ${fineAmount} to user ${userUid} and marked loan ${loanId}.`);
                 } else {
                     // Optionally mark fineApplied as false if no fine
                     await firestoreAdmin.collection('loans').doc(loanId).update({ fineApplied: false });
                 }

             } else {
                  console.warn(`API Route /api/dispenser/return-loan: Could not calculate fine for loan ${loanId} because returnTime is not a valid Timestamp.`);
             }
        } else {
             console.warn(`API Route /api/dispenser/return-loan: Could not fetch updated loan document ${loanId} after transaction for fine calculation.`);
        }


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
    const baseDurationMinutes = 20;
    let bonusMinutes = 0;

    switch (donationTier?.toLowerCase()) {
        case 'donador bajo':
            bonusMinutes = 15; // 20 + 15 = 35 mins total
            break;
        case 'donador medio':
            bonusMinutes = 35; // 20 + 35 = 55 mins total
            break;
        case 'donador alto':
            bonusMinutes = 60; // 20 + 60 = 80 mins total
            break;
        default: // Gratuito or undefined
            bonusMinutes = 0;
            break;
    }
    return (baseDurationMinutes + bonusMinutes) * 60 * 1000; // Convert total minutes to ms
}

// Calculates the fine amount based on loan duration vs allowed time.
function calculateFine(loanData: LoanDoc, userData: UserDoc | null, returnTimeActual: Timestamp): number {
    if (!loanData.loanTime || !returnTimeActual) {
        console.warn("API Route /api/dispenser/return-loan: Fine calculation skipped - missing loan or return time.");
        return 0; // Cannot calculate without times
    }

    // Firestore Timestamps need to be converted to JS Dates for calculation
    const loanStartTime = loanData.loanTime.toDate();
    const returnTime = returnTimeActual.toDate(); // Use the actual return time

    const loanDurationMs = returnTime.getTime() - loanStartTime.getTime();
    const allowedDurationMs = getAllowedDurationMs(userData?.donationTier);

    const overdueMs = loanDurationMs - allowedDurationMs;

    // Add a small grace period (e.g., 1 minute) to account for minor clock sync issues
    const gracePeriodMs = 1 * 60 * 1000;
    if (overdueMs <= gracePeriodMs) {
        console.log(`API Route /api/dispenser/return-loan: Loan returned on time or within grace period (Overdue: ${overdueMs}ms).`);
        return 0; // No fine
    }

    // --- Define Fine Structure ---
    // Example: $2000 COP per 15-minute block (or part thereof) overdue
    const finePerBlock = 2000;
    const blockDurationMs = 15 * 60 * 1000; // 15 minutes in ms

    // Calculate how many full 15-minute blocks were overdue
    const overdueBlocks = Math.ceil((overdueMs - gracePeriodMs) / blockDurationMs); // Round up

    const calculatedFine = overdueBlocks * finePerBlock;
    console.log(`API Route /api/dispenser/return-loan: Loan overdue by ${overdueMs}ms (${overdueBlocks} blocks). Fine applied: ${calculatedFine} COP.`);

    // Optional: Add a maximum fine limit
    // const maxFine = 15000;
    // return Math.min(calculatedFine, maxFine);

    return calculatedFine;
}
