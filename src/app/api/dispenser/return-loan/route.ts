
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase/admin-config';
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import { FieldValue } from 'firebase-admin/firestore';

// Define expected request body structure
interface ReturnRequestBody {
    stationId: string;
    // We might need userUid if multiple users could return to the same station concurrently,
    // but for a simpler model, we assume the station knows which loan is being returned (e.g., only one slot).
    // For a more robust system, the ESP32 might need to identify *which* umbrella was returned,
    // possibly linking it back to the user. Let's keep it simple for now.
    // userUid?: string;
}

// Define possible response structures
interface ReturnResponseBody {
    success: boolean;
    message: string;
}

// Define Firestore data structures (matching request-loan)
interface UserDoc {
    hasActiveLoan?: boolean;
    fineAmount?: number;
}

interface LoanDoc {
    userId: string;
    stationId: string;
    loanTime: FirebaseFirestore.Timestamp; // Expect Timestamp after retrieval
    returnTime?: FieldValue;
    isReturned: boolean;
    fineApplied?: boolean;
}

export async function POST(request: NextRequest) {
    console.log("Received /api/dispenser/return-loan POST request");

    // 1. Authenticate the ESP32 device
    if (!authenticateEsp32Request(request)) {
        console.warn("Return request failed: Unauthorized ESP32 device.");
        return NextResponse.json({ success: false, message: 'Dispositivo no autorizado.' }, { status: 401 });
    }
     console.log("ESP32 Authenticated.");

    // 2. Parse Request Body
    let body: ReturnRequestBody;
    try {
        body = await request.json();
        if (!body.stationId) {
            throw new Error('Missing stationId in request body.');
        }
        console.log("Request Body Parsed:", body);
    } catch (error) {
        console.error("Return request failed: Invalid request body.", error);
        return NextResponse.json({ success: false, message: 'Solicitud inválida.' }, { status: 400 });
    }

    const { stationId } = body;

    try {
        // --- Find the active loan associated with this return ---
        // !! Simplistic Approach: Find *any* active loan potentially associated with this station !!
        // A more robust system would require the ESP32 to identify the *specific* umbrella/loan slot.
        // For now, let's find the *oldest* active loan (assuming one return at a time per user concept).
        // We need the userId to update their status. This query finds the loan to get the userId.

        const activeLoansQuery = firestoreAdmin.collection('loans')
            .where('isReturned', '==', false)
            // .where('stationId', '==', stationId) // Might add this back if ESP32 confirms return *to this station*
            .orderBy('loanTime', 'asc') // Get the oldest active loan first
            .limit(1);

        const querySnapshot = await activeLoansQuery.get();

        if (querySnapshot.empty) {
             console.warn(`Return failed: No active loan found to return at station ${stationId}. Might be a race condition or logic error.`);
             // It's possible the user already returned or there's no active loan.
             // We might still increment the station count if an umbrella physically arrived.
             // Let's proceed cautiously and *not* fail here, but log it.
             // Consider adding logic to just increment station count if no loan is found.
              // For now, let's just increment the station count regardless if a physical return happened.
             try {
                 const stationDocRef = firestoreAdmin.collection('stations').doc(stationId);
                 await stationDocRef.update({ availableUmbrellas: FieldValue.increment(1) });
                 console.log(`Incremented umbrella count for station ${stationId} even though no matching active loan was found.`);
                 return NextResponse.json({ success: true, message: 'Devolución registrada (sin préstamo activo asociado).' }, { status: 200 });
             } catch (stationError) {
                 console.error(`Error incrementing station ${stationId} count after failed loan lookup:`, stationError);
                 return NextResponse.json({ success: false, message: 'Error al actualizar estación.' }, { status: 500 });
             }
        }

        const loanDocSnap = querySnapshot.docs[0];
        const loanData = loanDocSnap.data() as LoanDoc;
        const loanId = loanDocSnap.id;
        const userId = loanData.userId;

        console.log(`Found active loan ${loanId} for user ${userId} potentially associated with station ${stationId}.`);


        // 3. Start Firestore Transaction for Return
        await firestoreAdmin.runTransaction(async (transaction) => {
            const loanDocRef = firestoreAdmin.collection('loans').doc(loanId);
            const userDocRef = firestoreAdmin.collection('users').doc(userId);
            const stationDocRef = firestoreAdmin.collection('stations').doc(stationId); // Station where it was returned

            // --- Perform Updates ---
            // Mark loan as returned
            transaction.update(loanDocRef, {
                isReturned: true,
                returnTime: FieldValue.serverTimestamp(),
                // TODO: Add fine calculation logic here based on loanTime and returnTime
                 // fineApplied: calculatedFine > 0, // Example
            });

            // Update user status
            transaction.update(userDocRef, {
                 hasActiveLoan: false,
                 // TODO: Increment fineAmount if a fine was applied
                 // fineAmount: FieldValue.increment(calculatedFine), // Example
            });

            // Update station umbrella count (for the station where it was returned)
             // Ensure station exists before incrementing (optional safety check)
             const stationSnap = await transaction.get(stationDocRef);
             if (stationSnap.exists) {
                transaction.update(stationDocRef, { availableUmbrellas: FieldValue.increment(1) });
                console.log(`Loan ${loanId} marked returned, user ${userId} marked inactive, station ${stationId} count incremented.`);
             } else {
                 console.warn(`Station ${stationId} not found during return transaction, cannot increment count.`);
                 // Decide how to handle this - throw error? Log only?
             }


            // TODO: Implement fine calculation logic
            // const loanDuration = Date.now() - loanData.loanTime.toDate().getTime();
            // const allowedDuration = calculateAllowedDuration(userData.donationTier); // Function needed
            // if (loanDuration > allowedDuration) { ... apply fine ... }

        });

        // 4. Send Success Response
        console.log(`Return processed successfully for loan ${loanId} at station ${stationId}.`);
        return NextResponse.json({ success: true, message: 'Devolución exitosa.' }, { status: 200 });

    } catch (error: any) {
        console.error(`Error processing return for station ${stationId}:`, error);
        // Avoid revealing specific loan/user IDs in generic errors
        return NextResponse.json({ success: false, message: 'Error interno del servidor al procesar devolución.' }, { status: 500 });
    }
}

// Placeholder for fine calculation logic (needs implementation)
function calculateFine(loanData: LoanDoc, userData: UserDoc): number {
    // Compare loanData.loanTime with FieldValue.serverTimestamp() (or estimated current time)
    // Consider userData.donationTier for allowed time extension
    // Return fine amount
    return 0; // Placeholder
}

// Placeholder for allowed duration logic (needs implementation)
function calculateAllowedDuration(donationTier?: string): number {
    const baseDuration = 4 * 60 * 60 * 1000; // 4 hours in ms (example)
    // Add extra time based on tier
    return baseDuration; // Placeholder
}
