
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase/admin-config';
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import { FieldValue } from 'firebase-admin/firestore';

// Define expected request body structure
interface LoanRequestBody {
    userUid: string; // Assuming ESP32 reads student ID/UID directly
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
    hasActiveLoan?: boolean;
    fineAmount?: number;
    donationTier?: string;
}

interface LoanDoc {
    userId: string;
    stationId: string;
    loanTime: FieldValue; // Use server timestamp
    returnTime?: FieldValue;
    isReturned: boolean;
    fineApplied?: boolean;
}

interface StationDoc {
    name?: string;
    location?: string;
    availableUmbrellas?: number;
    coords?: admin.firestore.GeoPoint;
}


export async function POST(request: NextRequest) {
    console.log("Received /api/dispenser/request-loan POST request");

    // 1. Authenticate the ESP32 device
    if (!authenticateEsp32Request(request)) {
        console.warn("Loan request failed: Unauthorized ESP32 device.");
        return NextResponse.json({ authorized: false, message: 'Dispositivo no autorizado.' }, { status: 401 });
    }
    console.log("ESP32 Authenticated.");

    // 2. Parse Request Body
    let body: LoanRequestBody;
    try {
        body = await request.json();
        if (!body.userUid || !body.stationId) {
            throw new Error('Missing userUid or stationId in request body.');
        }
        console.log("Request Body Parsed:", body);
    } catch (error) {
        console.error("Loan request failed: Invalid request body.", error);
        return NextResponse.json({ authorized: false, message: 'Solicitud inválida.' }, { status: 400 });
    }

    const { userUid, stationId } = body;

    try {
        // 3. Start Firestore Transaction
        const loanResult = await firestoreAdmin.runTransaction(async (transaction) => {
            const userDocRef = firestoreAdmin.collection('users').doc(userUid);
            const stationDocRef = firestoreAdmin.collection('stations').doc(stationId);
            const newLoanDocRef = firestoreAdmin.collection('loans').doc(); // Generate new loan ID

            // Get user and station data within the transaction
            const userDocSnap = await transaction.get(userDocRef);
            const stationDocSnap = await transaction.get(stationDocRef);

            // --- Validation Checks ---
            if (!userDocSnap.exists) {
                console.log(`Validation Failed: User ${userUid} not found.`);
                return { authorized: false, message: 'Usuario no encontrado.' };
            }
             if (!stationDocSnap.exists) {
                console.log(`Validation Failed: Station ${stationId} not found.`);
                return { authorized: false, message: 'Estación no encontrada.' };
            }

            const userData = userDocSnap.data() as UserDoc;
            const stationData = stationDocSnap.data() as StationDoc;


            // Check for active loan
            if (userData.hasActiveLoan) {
                console.log(`Validation Failed: User ${userUid} already has an active loan.`);
                return { authorized: false, message: 'Ya tienes un préstamo activo.' };
            }

            // Check for fines (example: block if fine > 0)
            if (userData.fineAmount && userData.fineAmount > 0) {
                console.log(`Validation Failed: User ${userUid} has outstanding fine of ${userData.fineAmount}.`);
                return { authorized: false, message: `Tienes una multa pendiente de $${userData.fineAmount}.` };
            }

            // Check umbrella availability
            if (!stationData.availableUmbrellas || stationData.availableUmbrellas <= 0) {
                console.log(`Validation Failed: Station ${stationId} has no available umbrellas.`);
                return { authorized: false, message: 'No hay paraguas disponibles en esta estación.' };
            }

            console.log(`Validation Passed for User ${userUid} at Station ${stationId}.`);

            // --- Perform Updates (if validation passed) ---
            // Create new loan document
            const newLoanData: LoanDoc = {
                userId: userUid,
                stationId: stationId,
                loanTime: FieldValue.serverTimestamp(),
                isReturned: false,
            };
            transaction.set(newLoanDocRef, newLoanData);

            // Update user status
            transaction.update(userDocRef, { hasActiveLoan: true });

            // Update station umbrella count
            transaction.update(stationDocRef, { availableUmbrellas: FieldValue.increment(-1) });

            console.log(`Loan ${newLoanDocRef.id} created, user ${userUid} marked active, station ${stationId} count decremented.`);

            // Return success details including the new loan ID
            return { authorized: true, message: 'Préstamo autorizado.', loanId: newLoanDocRef.id };
        });

        // 4. Send Response based on transaction outcome
        if (loanResult.authorized) {
            console.log(`Loan authorized successfully for user ${userUid}. Loan ID: ${loanResult.loanId}`);
            return NextResponse.json(loanResult, { status: 200 });
        } else {
            console.log(`Loan request denied for user ${userUid}: ${loanResult.message}`);
            return NextResponse.json(loanResult, { status: 403 }); // Forbidden or appropriate status
        }

    } catch (error: any) {
        console.error(`Error processing loan request for user ${userUid} at station ${stationId}:`, error);
        return NextResponse.json({ authorized: false, message: 'Error interno del servidor.' }, { status: 500 });
    }
}
