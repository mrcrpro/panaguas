
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin, admin } from '@/lib/firebase/admin-config'; // Import admin for types
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import type { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import specific types
import { sendReturnConfirmationEmail, sendFineNotificationEmail } from '@/services/email-service'; // Import email service

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
    returnTime?: FieldValue | Timestamp; // Timestamp when read after update
    returnedAtStationId?: string; // Add field for return station ID
    isReturned: boolean;
    fineApplied?: boolean;
    fineAmountCalculated?: number; // Store calculated fine amount on the loan doc
    // Fields to track reminder emails
    warningEmailSent15min?: boolean;
    warningEmailSent5min?: boolean;
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
    let userUid: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;
    let loanIdForEmail: string | null = null;
    let returnStationName: string | null = null;

    try {
        // --- Find User by uniandesCode ---
        console.log(`API Route /api/dispenser/return-loan: Looking for user with uniandesCode ${uniandesCode}.`);
        const usersRef = firestoreAdmin.collection('users');
        const userQuery = usersRef.where('uniandesCode', '==', uniandesCode).limit(1);
        const userQuerySnapshot = await userQuery.get();

        if (userQuerySnapshot.empty) {
            console.warn(`API Route /api/dispenser/return-loan: Return failed - User with code ${uniandesCode} not found.`);
            return NextResponse.json({ success: false, message: 'Usuario no encontrado.' }, { status: 404 });
        }

        const userDocSnap = userQuerySnapshot.docs[0];
        userUid = userDocSnap.id; // Get the actual Firebase Auth UID
        const userData = userDocSnap.data() as UserDoc;
        userEmail = userData.email ?? null; // Get email for notifications
        userName = userData.name ?? null;   // Get name for notifications
        console.log(`API Route /api/dispenser/return-loan: Found user ${userUid} (${userEmail}) for code ${uniandesCode}.`);


        // --- Find the active loan for the specific user UID ---
        console.log(`API Route /api/dispenser/return-loan: Looking for active loan for user UID ${userUid}.`);
        const activeLoansQuery = firestoreAdmin.collection('loans')
            .where('userId', '==', userUid) // Query using Firebase UID
            .where('isReturned', '==', false)
            .limit(1);

        const loanQuerySnapshot = await activeLoansQuery.get();

        if (loanQuerySnapshot.empty) {
             console.warn(`API Route /api/dispenser/return-loan: Return failed - No active loan found for user ${userUid} (Code: ${uniandesCode}). User might have already returned it.`);
             return NextResponse.json({ success: false, message: 'No tienes un préstamo activo para devolver.' }, { status: 409 }); // 409 Conflict might be suitable
        }

        const loanDocSnap = loanQuerySnapshot.docs[0];
        const loanData = loanDocSnap.data() as LoanDoc;
        const loanId = loanDocSnap.id;
        loanIdForEmail = loanId; // Store for email sending

        console.log(`API Route /api/dispenser/return-loan: Found active loan ${loanId} for user ${userUid}.`);

        // 3. Start Firestore Transaction for Return
        let fineAmount = 0; // Variable to store calculated fine
        let returnTimestampActual: Timestamp | null = null; // To store the actual return time

         console.log(`API Route /api/dispenser/return-loan: Starting transaction for return of loan ${loanId} at station ${returnStationId}.`);
        await firestoreAdmin.runTransaction(async (transaction) => {
            if (!userUid) throw new Error("User UID is unexpectedly null inside transaction.");

            const loanDocRef = firestoreAdmin.collection('loans').doc(loanId);
            const userDocRef = firestoreAdmin.collection('users').doc(userUid); // Use Firebase UID
            const stationDocRef = firestoreAdmin.collection('stations').doc(returnStationId); // Station where it was returned

            // Fetch current user data within transaction for fine calculation/tier logic
             const [currentUserSnap, currentLoanSnap, stationSnap] = await Promise.all([
                 transaction.get(userDocRef),
                 transaction.get(loanDocRef), // Re-fetch loan to ensure it wasn't just returned
                 transaction.get(stationDocRef)
             ]);

            const currentUserData = currentUserSnap.exists ? currentUserSnap.data() as UserDoc : null;
            const currentLoanData = currentLoanSnap.exists ? currentLoanSnap.data() as LoanDoc : null;

             // Double-check if loan was already returned in another request
             if (!currentLoanSnap.exists || currentLoanData?.isReturned) {
                 console.warn(`API Route /api/dispenser/return-loan: Transaction aborted - Loan ${loanId} was already returned or deleted.`);
                 // Don't throw error here, let the outer check handle it, but log it.
                 // This prevents unnecessary writes if the state changed.
                 return; // Exit transaction gracefully
             }

             if (!currentUserData) {
                 console.error(`API Route /api/dispenser/return-loan: CRITICAL - User ${userUid} disappeared during transaction.`);
                  // We could throw an error here to rollback, but the loan return might still be valid
                  // Let's proceed with return but log the inconsistency.
                  // throw new Error("User disappeared during return transaction.");
             }

             if (!stationSnap.exists) {
                 console.warn(`API Route /api/dispenser/return-loan: Return Station ${returnStationId} not found during transaction. Count not incremented.`);
                 returnStationName = "Estación Desconocida"; // Set default for email
                 // Don't throw error, allow return process but log missing station
             } else {
                  const stationData = stationSnap.data() as StationDoc;
                  returnStationName = stationData.name ?? "Estación Desconocida"; // Store for email
             }


            // --- Calculate Fine within transaction using fetched data ---
             const returnTimestamp = admin.firestore.Timestamp.now(); // Get current time for calculation
             returnTimestampActual = returnTimestamp; // Store for later use outside transaction if needed

             fineAmount = calculateFine(currentLoanData, currentUserData, returnTimestamp);
             console.log(`API Route /api/dispenser/return-loan: Transaction - Calculated fine: ${fineAmount}`);


             // --- Perform Updates ---
             const loanUpdateData: Partial<LoanDoc> = {
                 isReturned: true,
                 returnTime: returnTimestamp, // Use the calculated timestamp
                 returnedAtStationId: returnStationId,
                 fineApplied: fineAmount > 0,
                 fineAmountCalculated: fineAmount // Store the calculated fine
             };
             transaction.update(loanDocRef, loanUpdateData);
             console.log(`API Route /api/dispenser/return-loan: Transaction - Loan ${loanId} marked as returned at station ${returnStationId}. Fine applied: ${fineAmount > 0}`);

            // Update User Status (set hasActiveLoan to false) and potentially increment fine amount
            const userUpdateData: Partial<UserDoc> = { hasActiveLoan: false };
            if (fineAmount > 0) {
                // Increment fine amount on user profile
                userUpdateData.fineAmount = admin.firestore.FieldValue.increment(fineAmount);
            }
            transaction.update(userDocRef, userUpdateData);
            console.log(`API Route /api/dispenser/return-loan: Transaction - User ${userUid} marked as inactive. Fine incremented by ${fineAmount}.`);


            // Update Station Umbrella Count (only if station exists and has capacity)
             if (stationSnap.exists) {
                 const stationData = stationSnap.data() as StationDoc;
                 if (typeof stationData.capacity !== 'number' || (stationData.availableUmbrellas ?? 0) < stationData.capacity) {
                    transaction.update(stationDocRef, { availableUmbrellas: admin.firestore.FieldValue.increment(1) });
                    console.log(`API Route /api/dispenser/return-loan: Transaction - Station ${returnStationId} umbrella count incremented.`);
                 } else {
                      console.warn(`API Route /api/dispenser/return-loan: Station ${returnStationId} already at capacity (${stationData.capacity}). Count not incremented.`);
                 }
             }
             // No need to handle station not found error here again, already logged above.

        }); // End of transaction

         console.log(`API Route /api/dispenser/return-loan: Transaction completed for loan ${loanId}. Final calculated fine: ${fineAmount}`);

        // 4. Send Confirmation Email (After Transaction)
        if (userEmail && loanIdForEmail && returnStationName) {
             console.log(`API Route /api/dispenser/return-loan: Sending return confirmation email to ${userEmail} for loan ${loanIdForEmail}.`);
             // Send return confirmation, including fine info if applicable
             sendReturnConfirmationEmail(
                 { email: userEmail, name: userName ?? undefined },
                 returnStationName,
                 loanIdForEmail,
                 fineAmount > 0 ? fineAmount : undefined // Only pass fine amount if > 0
             ).catch(emailError => {
                  console.error(`API Route /api/dispenser/return-loan: Failed to send return confirmation email for loan ${loanIdForEmail}:`, emailError);
             });

             // Note: The fine notification is now part of the return confirmation email if fineAmount > 0.
             // If you want a separate email *only* for fines, you could uncomment the below,
             // but it might be redundant.
             // if (fineAmount > 0) {
             //   sendFineStartedEmail( // Or use sendFineNotificationEmail if that's preferred
             //     { email: userEmail, name: userName ?? undefined },
             //     loanIdForEmail
             //   ).catch(emailError => {
             //        console.error(`API Route /api/dispenser/return-loan: Failed to send fine started email for loan ${loanIdForEmail}:`, emailError);
             //    });
             // }

        } else {
             console.warn(`API Route /api/dispenser/return-loan: Could not send return email for loan ${loanIdForEmail} due to missing data (Email: ${userEmail}, StationName: ${returnStationName}).`);
        }


        // 5. Send Success Response to ESP32
        console.log(`API Route /api/dispenser/return-loan: Return processed successfully for loan ${loanId} at station ${returnStationId}. Sending 200 response.`);
        return NextResponse.json({ success: true, message: 'Devolución exitosa.' }, { status: 200 });

    } catch (error: any) {
        console.error(`API Route /api/dispenser/return-loan: Critical error processing return for user code ${uniandesCode} at station ${returnStationId}:`, error);
        // Check if it's a transaction failure specific message (e.g., concurrent modification)
        if (error.message && error.message.includes('transaction')) {
             return NextResponse.json({ success: false, message: 'Error al procesar la devolución, intenta de nuevo.' }, { status: 500 });
        }
        return NextResponse.json({ success: false, message: 'Error interno del servidor al procesar devolución.' }, { status: 500 });
    }
}

// --- Fine Calculation Logic ---
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

// Now expects LoanDoc | null and UserDoc | null for safety
function calculateFine(loanData: LoanDoc | null, userData: UserDoc | null, returnTimeActual: Timestamp): number {
    if (!loanData || !loanData.loanTime || !(loanData.loanTime instanceof Timestamp)) {
        console.warn("API Route /api/dispenser/return-loan: Fine calculation skipped - missing or invalid loan time.");
        return 0;
    }

    const loanStartTime = loanData.loanTime.toDate();
    const returnTime = returnTimeActual.toDate(); // Already a Timestamp

    const loanDurationMs = returnTime.getTime() - loanStartTime.getTime();
    // Pass userData?.donationTier safely
    const allowedDurationMs = getAllowedDurationMs(userData?.donationTier);

    const overdueMs = loanDurationMs - allowedDurationMs;
    const gracePeriodMs = 1 * 60 * 1000; // 1 minute grace period

    if (overdueMs <= gracePeriodMs) {
        console.log(`API Route /api/dispenser/return-loan: Loan ${loanData.userId ? `for user ${loanData.userId}` : ''} returned on time or within grace period (Overdue: ${overdueMs.toFixed(0)}ms).`);
        return 0; // No fine if within grace period
    }

    const finePerBlock = 2000; // 2000 COP per block
    const blockDurationMs = 15 * 60 * 1000; // 15 minutes block

    // Calculate blocks strictly after the grace period
    const overdueBlocks = Math.ceil((overdueMs - gracePeriodMs) / blockDurationMs);
    const calculatedFine = overdueBlocks * finePerBlock;

    console.log(`API Route /api/dispenser/return-loan: Loan ${loanData.userId ? `for user ${loanData.userId}` : ''} overdue by ${overdueMs.toFixed(0)}ms (${overdueBlocks} blocks after grace). Fine applied: ${calculatedFine} COP.`);

    return calculatedFine;
}
