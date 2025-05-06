
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin, admin } from '@/lib/firebase/admin-config'; // Import admin for types
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import type { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import specific types

// Define expected request body structure
interface ReturnRequestBody {
    stationId: string;
    // Use uniandesCode to identify the user returning the umbrella
    uniandesCode: string;
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
    uniandesCode?: string; // Added uniandesCode
    hasActiveLoan?: boolean;
    fineAmount?: number;
    donationTier?: string;
}

interface LoanDoc {
    userId: string; // Firebase Auth UID
    uniandesCode: string; // Uniandes Code
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
        // Require uniandesCode for reliable return processing
        if (!body.stationId || !body.uniandesCode) {
            throw new Error('Missing stationId or uniandesCode in request body.');
        }
        console.log("API Route /api/dispenser/return-loan: Request Body Parsed:", body);
    } catch (error) {
        console.error("API Route /api/dispenser/return-loan: Invalid request body.", error);
        return NextResponse.json({ success: false, message: 'Solicitud inválida.' }, { status: 400 });
    }

    const { stationId: returnStationId, uniandesCode } = body; // Rename for clarity

    try {
        // --- Find User by uniandesCode ---
        console.log(`API Route /api/dispenser/return-loan: Looking for user with uniandesCode ${uniandesCode}.`);
        const usersRef = firestoreAdmin.collection('users');
        // IMPORTANT: Ensure you have a Firestore index on 'uniandesCode' for this query!
        const userQuery = usersRef.where('uniandesCode', '==', uniandesCode).limit(1);
        const userQuerySnapshot = await userQuery.get();

        if (userQuerySnapshot.empty) {
            console.warn(`API Route /api/dispenser/return-loan: Return failed - User with code ${uniandesCode} not found.`);
             // Even if the user isn't found, if an umbrella is physically returned, we might
             // still want to increment the station count, but log the inconsistency.
             // However, for now, let's treat it as an error preventing the full return process.
            return NextResponse.json({ success: false, message: 'Usuario no encontrado.' }, { status: 404 });
        }

        const userDocSnap = userQuerySnapshot.docs[0];
        const userUid = userDocSnap.id; // Get the actual Firebase Auth UID
        const userData = userDocSnap.data() as UserDoc;
        console.log(`API Route /api/dispenser/return-loan: Found user ${userUid} for code ${uniandesCode}.`);


        // --- Find the active loan for the specific user UID ---
        console.log(`API Route /api/dispenser/return-loan: Looking for active loan for user UID ${userUid}.`);
        const activeLoansQuery = firestoreAdmin.collection('loans')
            .where('userId', '==', userUid) // Query using Firebase UID
            .where('isReturned', '==', false)
            .limit(1);

        const loanQuerySnapshot = await activeLoansQuery.get();

        if (loanQuerySnapshot.empty) {
             console.warn(`API Route /api/dispenser/return-loan: Return failed - No active loan found for user ${userUid} (Code: ${uniandesCode}).`);
             // This might mean they tried returning twice, or the loan wasn't created.
             // Let's return an error.
             return NextResponse.json({ success: false, message: 'No tienes un préstamo activo para devolver.' }, { status: 400 }); // Bad Request or Not Found (404)
        }

        const loanDocSnap = loanQuerySnapshot.docs[0];
        const loanData = loanDocSnap.data() as LoanDoc;
        const loanId = loanDocSnap.id;

        console.log(`API Route /api/dispenser/return-loan: Found active loan ${loanId} for user ${userUid}.`);

        // 3. Start Firestore Transaction for Return
         console.log(`API Route /api/dispenser/return-loan: Starting transaction for return of loan ${loanId} at station ${returnStationId}.`);
        await firestoreAdmin.runTransaction(async (transaction) => {
            const loanDocRef = firestoreAdmin.collection('loans').doc(loanId);
            const userDocRef = firestoreAdmin.collection('users').doc(userUid); // Use Firebase UID
            const stationDocRef = firestoreAdmin.collection('stations').doc(returnStationId); // Station where it was returned

            // Fetch current user data within transaction for fine calculation/tier logic
            const currentUserSnap = await transaction.get(userDocRef);
            const currentUserData = currentUserSnap.exists ? currentUserSnap.data() as UserDoc : null;

             // --- Perform Updates ---
             const returnTimestamp = admin.firestore.FieldValue.serverTimestamp();

             // Update Loan Document
             transaction.update(loanDocRef, {
                isReturned: true,
                returnTime: returnTimestamp,
                returnedAtStationId: returnStationId,
            });
             console.log(`API Route /api/dispenser/return-loan: Transaction - Loan ${loanId} marked as returned at station ${returnStationId}.`);

            // Update User Status (set hasActiveLoan to false)
            const userUpdateData: Partial<UserDoc> = { hasActiveLoan: false };
            transaction.update(userDocRef, userUpdateData);
            console.log(`API Route /api/dispenser/return-loan: Transaction - User ${userUid} marked as inactive (no active loan).`);


            // Update Station Umbrella Count
             const stationSnap = await transaction.get(stationDocRef);
             if (stationSnap.exists) {
                 const stationData = stationSnap.data() as StationDoc;
                 if (typeof stationData.capacity !== 'number' || (stationData.availableUmbrellas ?? 0) < stationData.capacity) {
                    transaction.update(stationDocRef, { availableUmbrellas: admin.firestore.FieldValue.increment(1) });
                    console.log(`API Route /api/dispenser/return-loan: Transaction - Station ${returnStationId} umbrella count incremented.`);
                 } else {
                      console.warn(`API Route /api/dispenser/return-loan: Station ${returnStationId} already at capacity (${stationData.capacity}). Count not incremented.`);
                 }
             } else {
                 console.warn(`API Route /api/dispenser/return-loan: Station ${returnStationId} not found during return, cannot increment count.`);
                 // Optionally, throw an error to rollback if station consistency is critical.
                 // throw new Error(`Return station ${returnStationId} not found.`);
             }
        });
         console.log(`API Route /api/dispenser/return-loan: Transaction completed for loan ${loanId}.`);

        // --- Fine Calculation (After Transaction) ---
        const updatedLoanSnap = await firestoreAdmin.collection('loans').doc(loanId).get();
        if (updatedLoanSnap.exists) {
             const finalLoanData = updatedLoanSnap.data() as LoanDoc;
             const userSnap = await firestoreAdmin.collection('users').doc(userUid).get(); // Fetch user again to get latest donation tier
             const finalUserData = userSnap.exists ? userSnap.data() as UserDoc : null;

             if (finalLoanData.returnTime instanceof Timestamp) {
                const fineAmount = calculateFine(finalLoanData, finalUserData, finalLoanData.returnTime);
                 console.log(`API Route /api/dispenser/return-loan: Post-transaction Fine Calculation - Calculated fine: ${fineAmount}`);

                 if (fineAmount > 0) {
                    const loanUpdate: Partial<LoanDoc> = { fineApplied: true };
                    const userUpdate: Partial<UserDoc> = { fineAmount: admin.firestore.FieldValue.increment(fineAmount) };

                    await Promise.all([
                        firestoreAdmin.collection('loans').doc(loanId).update(loanUpdate),
                        firestoreAdmin.collection('users').doc(userUid).update(userUpdate)
                    ]);
                    console.log(`API Route /api/dispenser/return-loan: Applied fine of ${fineAmount} to user ${userUid} and marked loan ${loanId}.`);
                 } else {
                     await firestoreAdmin.collection('loans').doc(loanId).update({ fineApplied: false });
                 }

             } else {
                  console.warn(`API Route /api/dispenser/return-loan: Could not calculate fine for loan ${loanId} - returnTime invalid.`);
             }
        } else {
             console.warn(`API Route /api/dispenser/return-loan: Could not fetch updated loan doc ${loanId} for fine calc.`);
        }


        // 4. Send Success Response
        console.log(`API Route /api/dispenser/return-loan: Return processed successfully for loan ${loanId} at station ${returnStationId}. Sending 200 response.`);
        return NextResponse.json({ success: true, message: 'Devolución exitosa.' }, { status: 200 });

    } catch (error: any) {
        console.error(`API Route /api/dispenser/return-loan: Critical error processing return for user code ${uniandesCode} at station ${returnStationId}:`, error);
        return NextResponse.json({ success: false, message: 'Error interno del servidor al procesar devolución.' }, { status: 500 });
    }
}

// --- Fine Calculation Logic (Unchanged, uses UserDoc for donationTier) ---
function getAllowedDurationMs(donationTier?: string): number {
    const baseDurationMinutes = 20;
    let bonusMinutes = 0;

    switch (donationTier?.toLowerCase()) {
        case 'donador bajo':
            bonusMinutes = 15; // 35 mins total
            break;
        case 'donador medio':
            bonusMinutes = 35; // 55 mins total
            break;
        case 'donador alto':
            bonusMinutes = 60; // 80 mins total
            break;
        default: // Gratuito or undefined
            bonusMinutes = 0;
            break;
    }
    return (baseDurationMinutes + bonusMinutes) * 60 * 1000;
}

function calculateFine(loanData: LoanDoc, userData: UserDoc | null, returnTimeActual: Timestamp): number {
    if (!loanData.loanTime || !returnTimeActual) {
        console.warn("API Route /api/dispenser/return-loan: Fine calculation skipped - missing times.");
        return 0;
    }

    const loanStartTime = loanData.loanTime.toDate();
    const returnTime = returnTimeActual.toDate();

    const loanDurationMs = returnTime.getTime() - loanStartTime.getTime();
    const allowedDurationMs = getAllowedDurationMs(userData?.donationTier);

    const overdueMs = loanDurationMs - allowedDurationMs;
    const gracePeriodMs = 1 * 60 * 1000;

    if (overdueMs <= gracePeriodMs) {
        console.log(`API Route /api/dispenser/return-loan: Loan returned on time (Overdue: ${overdueMs}ms).`);
        return 0;
    }

    const finePerBlock = 2000;
    const blockDurationMs = 15 * 60 * 1000;
    const overdueBlocks = Math.ceil((overdueMs - gracePeriodMs) / blockDurationMs);
    const calculatedFine = overdueBlocks * finePerBlock;
    console.log(`API Route /api/dispenser/return-loan: Loan overdue by ${overdueMs}ms (${overdueBlocks} blocks). Fine applied: ${calculatedFine} COP.`);

    return calculatedFine;
}
