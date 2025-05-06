
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin, admin } from '@/lib/firebase/admin-config'; // Import admin for types
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import type { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import specific types

// Define expected request body structure
interface LoanRequestBody {
    // Use uniandesCode read from student card
    uniandesCode: string;
    stationId: string;
}

// Define possible response structures
interface LoanResponseBody {
    authorized: boolean;
    message: string;
    loanId?: string; // Optionally return the new loan ID
}

// Define Firestore data structures (adjust as needed)
interface UserDoc {
    name?: string;
    email?: string;
    uniandesCode?: string; // Added uniandesCode
    hasActiveLoan?: boolean;
    fineAmount?: number;
    donationTier?: string;
}

interface LoanDoc {
    userId: string; // Store Firebase Auth UID here
    uniandesCode: string; // Store Uniandes Code for reference
    stationId: string;
    loanTime: FieldValue | Timestamp; // Use server timestamp for creation, Timestamp for read
    returnTime?: FieldValue | Timestamp;
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
    console.log("API Route /api/dispenser/request-loan: Received POST request.");

    // 1. Authenticate the ESP32 device
    if (!authenticateEsp32Request(request)) {
        console.warn("API Route /api/dispenser/request-loan: Unauthorized ESP32 device.");
        return NextResponse.json({ authorized: false, message: 'Dispositivo no autorizado.' }, { status: 401 });
    }
    console.log("API Route /api/dispenser/request-loan: ESP32 Authenticated.");

    // 2. Parse Request Body
    let body: LoanRequestBody;
    try {
        body = await request.json();
        if (!body.uniandesCode || !body.stationId) {
            throw new Error('Missing uniandesCode or stationId in request body.');
        }
        console.log("API Route /api/dispenser/request-loan: Request Body Parsed:", body);
    } catch (error) {
        console.error("API Route /api/dispenser/request-loan: Invalid request body.", error);
        return NextResponse.json({ authorized: false, message: 'Solicitud inválida.' }, { status: 400 });
    }

    const { uniandesCode, stationId } = body;

    try {
        // --- Find User by uniandesCode ---
        console.log(`API Route /api/dispenser/request-loan: Looking for user with uniandesCode ${uniandesCode}.`);
        const usersRef = firestoreAdmin.collection('users');
        // IMPORTANT: Ensure you have a Firestore index on 'uniandesCode' for this query to work efficiently!
        const userQuery = usersRef.where('uniandesCode', '==', uniandesCode).limit(1);
        const userQuerySnapshot = await userQuery.get();

        if (userQuerySnapshot.empty) {
            console.log(`API Route /api/dispenser/request-loan: Validation Failed - User with uniandesCode ${uniandesCode} not found.`);
            return NextResponse.json({ authorized: false, message: 'Usuario no encontrado.' }, { status: 404 });
        }

        const userDocSnap = userQuerySnapshot.docs[0];
        const userUid = userDocSnap.id; // Get the actual Firebase Auth UID
        const userData = userDocSnap.data() as UserDoc;
         console.log(`API Route /api/dispenser/request-loan: Found user ${userUid} for code ${uniandesCode}.`);


        // 3. Start Firestore Transaction
        console.log(`API Route /api/dispenser/request-loan: Starting transaction for user ${userUid} at station ${stationId}.`);
        const loanResult = await firestoreAdmin.runTransaction(async (transaction) => {
            const userDocRef = firestoreAdmin.collection('users').doc(userUid); // Use the found UID
            const stationDocRef = firestoreAdmin.collection('stations').doc(stationId);
            const newLoanDocRef = firestoreAdmin.collection('loans').doc(); // Generate new loan ID

            // Get station data within the transaction (user data already fetched)
            const stationDocSnap = await transaction.get(stationDocRef);
             console.log(`API Route /api/dispenser/request-loan: Transaction - Station ${stationId} document retrieved.`);

            // --- Validation Checks ---
            // User existence already checked above
            if (!stationDocSnap.exists) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - Station ${stationId} not found.`);
                return { authorized: false, message: 'Estación no encontrada.' };
            }

            // Re-fetch user data within transaction for consistency (optional but safer)
             const freshUserSnap = await transaction.get(userDocRef);
             if (!freshUserSnap.exists) {
                 // Should not happen if found initially, but defensive check
                 console.error(`API Route /api/dispenser/request-loan: CRITICAL - User ${userUid} disappeared during transaction.`);
                 return { authorized: false, message: 'Error de usuario.' };
             }
             const currentTransactionUserData = freshUserSnap.data() as UserDoc;
             const stationData = stationDocSnap.data() as StationDoc;


            // Check for active loan using the most current data
            if (currentTransactionUserData.hasActiveLoan === true) { // Explicit check
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - User ${userUid} already has an active loan.`);
                return { authorized: false, message: 'Ya tienes un préstamo activo.' };
            }

            // Check for fines
            if (currentTransactionUserData.fineAmount && currentTransactionUserData.fineAmount > 0) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - User ${userUid} has outstanding fine of ${currentTransactionUserData.fineAmount}.`);
                return { authorized: false, message: `Tienes una multa pendiente de $${currentTransactionUserData.fineAmount}.` };
            }

            // Check umbrella availability
            if (typeof stationData.availableUmbrellas !== 'number' || stationData.availableUmbrellas <= 0) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - Station ${stationId} has no available umbrellas (Available: ${stationData.availableUmbrellas}).`);
                return { authorized: false, message: 'No hay paraguas disponibles en esta estación.' };
            }

             // Check station status
             if (stationData.status && stationData.status !== 'Operativa') {
                 console.log(`API Route /api/dispenser/request-loan: Validation Failed - Station ${stationId} is not operational (Status: ${stationData.status}).`);
                 return { authorized: false, message: `Estación ${stationData.status}.` };
             }


            console.log(`API Route /api/dispenser/request-loan: Validation Passed for User ${userUid} at Station ${stationId}.`);

            // --- Perform Updates (if validation passed) ---
            // Create new loan document
            const newLoanData: Omit<LoanDoc, 'loanTime'> & { loanTime: FieldValue } = {
                userId: userUid, // Store Firebase UID
                uniandesCode: uniandesCode, // Store Uniandes Code
                stationId: stationId,
                loanTime: admin.firestore.FieldValue.serverTimestamp(),
                isReturned: false,
            };
            transaction.set(newLoanDocRef, newLoanData);
            console.log(`API Route /api/dispenser/request-loan: Transaction - New loan document ${newLoanDocRef.id} prepared.`);

            // Update user status
            transaction.update(userDocRef, { hasActiveLoan: true });
             console.log(`API Route /api/dispenser/request-loan: Transaction - User ${userUid} marked as having active loan.`);

            // Update station umbrella count
            transaction.update(stationDocRef, { availableUmbrellas: admin.firestore.FieldValue.increment(-1) });
             console.log(`API Route /api/dispenser/request-loan: Transaction - Station ${stationId} umbrella count decremented.`);

            // Return success details including the new loan ID
            console.log(`API Route /api/dispenser/request-loan: Transaction successful for loan ${newLoanDocRef.id}.`);
            return { authorized: true, message: 'Préstamo autorizado. Retira tu paraguas.', loanId: newLoanDocRef.id };
        });

        // 4. Send Response based on transaction outcome
        if (loanResult.authorized) {
            console.log(`API Route /api/dispenser/request-loan: Loan ${loanResult.loanId} authorized successfully for user ${userUid}. Sending 200 response.`);
            return NextResponse.json(loanResult, { status: 200 });
        } else {
            console.log(`API Route /api/dispenser/request-loan: Loan request denied for user ${userUid}: ${loanResult.message}. Sending response.`);
             const status = loanResult.message.includes('no encontrado') ? 404 : 403; // Or 400 for bad request
             if (loanResult.message.includes('multa')) status = 402; // Payment Required might fit for fines
             if (loanResult.message.includes('préstamo activo')) status = 409; // Conflict
            return NextResponse.json(loanResult, { status: status });
        }

    } catch (error: any) {
        console.error(`API Route /api/dispenser/request-loan: Critical error processing loan request for code ${uniandesCode} at station ${stationId}:`, error);
        return NextResponse.json({ authorized: false, message: 'Error interno del servidor.' }, { status: 500 });
    }
}
