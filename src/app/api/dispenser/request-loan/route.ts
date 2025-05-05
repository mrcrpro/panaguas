
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin, admin } from '@/lib/firebase/admin-config'; // Import admin for types
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import type { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import specific types

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
        if (!body.userUid || !body.stationId) {
            throw new Error('Missing userUid or stationId in request body.');
        }
        console.log("API Route /api/dispenser/request-loan: Request Body Parsed:", body);
    } catch (error) {
        console.error("API Route /api/dispenser/request-loan: Invalid request body.", error);
        return NextResponse.json({ authorized: false, message: 'Solicitud inválida.' }, { status: 400 });
    }

    const { userUid, stationId } = body;

    try {
        // 3. Start Firestore Transaction
        console.log(`API Route /api/dispenser/request-loan: Starting transaction for user ${userUid} at station ${stationId}.`);
        const loanResult = await firestoreAdmin.runTransaction(async (transaction) => {
            const userDocRef = firestoreAdmin.collection('users').doc(userUid);
            const stationDocRef = firestoreAdmin.collection('stations').doc(stationId);
            const newLoanDocRef = firestoreAdmin.collection('loans').doc(); // Generate new loan ID

            console.log(`API Route /api/dispenser/request-loan: Transaction - Getting user ${userUid} and station ${stationId} documents.`);
            // Get user and station data within the transaction
            const [userDocSnap, stationDocSnap] = await Promise.all([
                transaction.get(userDocRef),
                transaction.get(stationDocRef)
            ]);
            console.log(`API Route /api/dispenser/request-loan: Transaction - Documents retrieved.`);

            // --- Validation Checks ---
            if (!userDocSnap.exists) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - User ${userUid} not found.`);
                return { authorized: false, message: 'Usuario no encontrado.' };
            }
            if (!stationDocSnap.exists) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - Station ${stationId} not found.`);
                return { authorized: false, message: 'Estación no encontrada.' };
            }

            const userData = userDocSnap.data() as UserDoc;
            const stationData = stationDocSnap.data() as StationDoc;


            // Check for active loan
            if (userData.hasActiveLoan === true) { // Explicit check
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - User ${userUid} already has an active loan.`);
                return { authorized: false, message: 'Ya tienes un préstamo activo.' };
            }

            // Check for fines (example: block if fine > 0)
            if (userData.fineAmount && userData.fineAmount > 0) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - User ${userUid} has outstanding fine of ${userData.fineAmount}.`);
                return { authorized: false, message: `Tienes una multa pendiente de $${userData.fineAmount}.` };
            }

            // Check umbrella availability
            if (typeof stationData.availableUmbrellas !== 'number' || stationData.availableUmbrellas <= 0) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - Station ${stationId} has no available umbrellas (Available: ${stationData.availableUmbrellas}).`);
                return { authorized: false, message: 'No hay paraguas disponibles en esta estación.' };
            }

             // Check station status (optional, depends if you use a 'status' field)
             if (stationData.status && stationData.status !== 'Operativa') {
                 console.log(`API Route /api/dispenser/request-loan: Validation Failed - Station ${stationId} is not operational (Status: ${stationData.status}).`);
                 return { authorized: false, message: `Estación ${stationData.status}.` };
             }


            console.log(`API Route /api/dispenser/request-loan: Validation Passed for User ${userUid} at Station ${stationId}.`);

            // --- Perform Updates (if validation passed) ---
            // Create new loan document
            const newLoanData: Omit<LoanDoc, 'loanTime'> & { loanTime: FieldValue } = { // Explicitly type for FieldValue
                userId: userUid,
                stationId: stationId,
                loanTime: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp explicitly
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
            console.log(`API Route /api/dispenser/request-loan: Loan request denied for user ${userUid}: ${loanResult.message}. Sending 403 response.`);
            // Use 403 Forbidden for authorization issues, 404 if user/station not found, etc.
            const status = loanResult.message.includes('no encontrado') ? 404 : 403;
            return NextResponse.json(loanResult, { status: status });
        }

    } catch (error: any) {
        console.error(`API Route /api/dispenser/request-loan: Critical error processing loan request for user ${userUid} at station ${stationId}:`, error);
        return NextResponse.json({ authorized: false, message: 'Error interno del servidor.' }, { status: 500 });
    }
}
