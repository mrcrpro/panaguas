
import { type NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin, admin } from '@/lib/firebase/admin-config'; // Import admin for types
import { authenticateEsp32Request } from '@/lib/auth/esp32-auth';
import type { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import specific types
import { sendLoanConfirmationEmail } from '@/services/email-service'; // Import email service

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

// Helper function to calculate allowed duration based on tier
function getAllowedDurationMs(donationTier?: string): number {
    const baseDurationMinutes = 20;
    let bonusMinutes = 0;
    switch (donationTier?.toLowerCase()) {
        case 'donador bajo': bonusMinutes = 15; break; // 35 total
        case 'donador medio': bonusMinutes = 35; break; // 55 total
        case 'donador alto': bonusMinutes = 60; break; // 80 total
        default: bonusMinutes = 0; break;
    }
    return (baseDurationMinutes + bonusMinutes) * 60 * 1000;
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
    let userUid: string | null = null; // To store user UID outside transaction for email
    let userEmail: string | null = null; // To store user email
    let userName: string | null = null; // To store user name
    let stationName: string | null = null; // To store station name for email

    try {
        // --- Find User by uniandesCode ---
        console.log(`API Route /api/dispenser/request-loan: Looking for user with uniandesCode ${uniandesCode}.`);
        const usersRef = firestoreAdmin.collection('users');
        const userQuery = usersRef.where('uniandesCode', '==', uniandesCode).limit(1);
        const userQuerySnapshot = await userQuery.get();

        if (userQuerySnapshot.empty) {
            console.log(`API Route /api/dispenser/request-loan: Validation Failed - User with uniandesCode ${uniandesCode} not found.`);
            return NextResponse.json({ authorized: false, message: 'Usuario no encontrado.' }, { status: 404 });
        }

        const userDocSnap = userQuerySnapshot.docs[0];
        userUid = userDocSnap.id; // Get the actual Firebase Auth UID
        const userData = userDocSnap.data() as UserDoc;
        userEmail = userData.email ?? null; // Get email for notifications
        userName = userData.name ?? null;   // Get name for notifications
         console.log(`API Route /api/dispenser/request-loan: Found user ${userUid} (${userEmail}) for code ${uniandesCode}.`);


        // 3. Start Firestore Transaction
        console.log(`API Route /api/dispenser/request-loan: Starting transaction for user ${userUid} at station ${stationId}.`);
        const loanResult = await firestoreAdmin.runTransaction(async (transaction) => {
            if (!userUid) throw new Error("User UID is unexpectedly null inside transaction."); // Should not happen

            const userDocRef = firestoreAdmin.collection('users').doc(userUid);
            const stationDocRef = firestoreAdmin.collection('stations').doc(stationId);
            const newLoanDocRef = firestoreAdmin.collection('loans').doc(); // Generate new loan ID

            // Get station data within the transaction
            const stationDocSnap = await transaction.get(stationDocRef);
             console.log(`API Route /api/dispenser/request-loan: Transaction - Station ${stationId} document retrieved.`);

            // --- Validation Checks ---
            if (!stationDocSnap.exists) {
                console.log(`API Route /api/dispenser/request-loan: Validation Failed - Station ${stationId} not found.`);
                return { authorized: false, message: 'Estación no encontrada.' };
            }

             // Re-fetch user data within transaction for consistency
             const freshUserSnap = await transaction.get(userDocRef);
             if (!freshUserSnap.exists) {
                 console.error(`API Route /api/dispenser/request-loan: CRITICAL - User ${userUid} disappeared during transaction.`);
                 return { authorized: false, message: 'Error de usuario.' };
             }
             const currentTransactionUserData = freshUserSnap.data() as UserDoc;
             const stationData = stationDocSnap.data() as StationDoc;
             stationName = stationData.name ?? 'Estación Desconocida'; // Store station name

            // Check for active loan using the most current data
            if (currentTransactionUserData.hasActiveLoan === true) {
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
            const newLoanData: Omit<LoanDoc, 'loanTime' | 'warningEmailSent15min' | 'warningEmailSent5min'> & { loanTime: FieldValue } = {
                userId: userUid,
                uniandesCode: uniandesCode,
                stationId: stationId,
                loanTime: admin.firestore.FieldValue.serverTimestamp(),
                isReturned: false,
                // Initialize reminder flags
                warningEmailSent15min: false,
                warningEmailSent5min: false,
            };
            transaction.set(newLoanDocRef, newLoanData);
            console.log(`API Route /api/dispenser/request-loan: Transaction - New loan document ${newLoanDocRef.id} prepared.`);

            transaction.update(userDocRef, { hasActiveLoan: true });
             console.log(`API Route /api/dispenser/request-loan: Transaction - User ${userUid} marked as having active loan.`);

            transaction.update(stationDocRef, { availableUmbrellas: admin.firestore.FieldValue.increment(-1) });
             console.log(`API Route /api/dispenser/request-loan: Transaction - Station ${stationId} umbrella count decremented.`);

            console.log(`API Route /api/dispenser/request-loan: Transaction successful for loan ${newLoanDocRef.id}.`);
            return {
                authorized: true,
                message: 'Préstamo autorizado. Retira tu paraguas.',
                loanId: newLoanDocRef.id,
                donationTier: currentTransactionUserData.donationTier // Pass tier for email duration calculation
            };
        });

        // 4. Send Response and Email (if authorized)
        if (loanResult.authorized && loanResult.loanId && userEmail && stationName) {
            console.log(`API Route /api/dispenser/request-loan: Loan ${loanResult.loanId} authorized successfully for user ${userUid}. Sending 200 response and email.`);

            // Send email confirmation (don't wait for it to complete before responding to ESP32)
            const allowedDurationMs = getAllowedDurationMs(loanResult.donationTier);
            const allowedDurationMinutes = Math.floor(allowedDurationMs / (60 * 1000));
            sendLoanConfirmationEmail(
                { email: userEmail, name: userName ?? undefined },
                stationName,
                loanResult.loanId,
                allowedDurationMinutes
             ).catch(emailError => {
                 // Log email sending errors but don't fail the request
                 console.error(`API Route /api/dispenser/request-loan: Failed to send confirmation email for loan ${loanResult.loanId}:`, emailError);
             });

             // Respond to ESP32 immediately
            return NextResponse.json({ authorized: true, message: loanResult.message, loanId: loanResult.loanId }, { status: 200 });

        } else {
            // Handle cases where authorization failed or necessary data for email is missing
            if (!loanResult.authorized) {
                 console.log(`API Route /api/dispenser/request-loan: Loan request denied for user ${userUid}: ${loanResult.message}. Sending response.`);
                 let status = loanResult.message.includes('no encontrado') ? 404 : 403; // Default to Forbidden
                 if (loanResult.message.includes('multa')) status = 402; // Payment Required
                 if (loanResult.message.includes('préstamo activo')) status = 409; // Conflict
                 if (loanResult.message.includes('Error de usuario')) status = 500; // Internal Server Error
                 if (loanResult.message.includes('paraguas disponibles')) status = 409; // Conflict - Resource Unavailable
                 if (loanResult.message.includes('Estación')) status = 409; // Conflict - Station status issue

                 return NextResponse.json({ authorized: false, message: loanResult.message }, { status: status });
            } else {
                 // Authorized but missing email data or station name - still respond OK but log the issue
                 console.warn(`API Route /api/dispenser/request-loan: Loan ${loanResult.loanId} authorized, but could not send email due to missing data (Email: ${userEmail}, Station: ${stationName}).`);
                 return NextResponse.json({ authorized: true, message: loanResult.message, loanId: loanResult.loanId }, { status: 200 });
            }
        }

    } catch (error: any) {
        console.error(`API Route /api/dispenser/request-loan: Critical error processing loan request for code ${uniandesCode} at station ${stationId}:`, error);
        return NextResponse.json({ authorized: false, message: 'Error interno del servidor.' }, { status: 500 });
    }
}
