
import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase/admin-config'; // Use Admin SDK
import type { FirebaseError } from 'firebase-admin'; // Import FirebaseError type for better typing

export const dynamic = 'force-dynamic' // Ensure fresh data on each request

// Define the structure of a station document from Firestore
interface StationDoc {
    name?: string;
    location?: string;
    status?: string; // Assuming status is stored directly
    availableUmbrellas?: number;
    // Use the correct GeoPoint type from firebase-admin
    coords?: admin.firestore.GeoPoint;
}

// Define the structure of the data returned by the API
interface StationAPIResponse {
    id: string;
    name: string;
    location: string;
    status: string;
    available: number;
    coords: [number, number];
}


export async function GET() {
    try {
        console.log("Attempting to fetch stations data from Firestore...");
        const stationsRef = firestoreAdmin.collection('stations');
        const snapshot = await stationsRef.get();

        if (snapshot.empty) {
            console.log("No station documents found in 'stations' collection.");
            return NextResponse.json([], { status: 200 });
        }

        console.log(`Found ${snapshot.docs.length} station documents. Mapping data...`);
        const stationsData: StationAPIResponse[] = snapshot.docs.map(doc => {
            const data = doc.data() as StationDoc;

            // More robust checks and defaults
            const name = data.name ?? 'Nombre Desconocido';
            const location = data.location ?? 'Ubicación Desconocida';
            const available = typeof data.availableUmbrellas === 'number' && !isNaN(data.availableUmbrellas) ? data.availableUmbrellas : 0;

            // Check coords validity
            const coords: [number, number] = data.coords && typeof data.coords.latitude === 'number' && typeof data.coords.longitude === 'number'
                ? [data.coords.latitude, data.coords.longitude] // Use .latitude and .longitude directly
                : [0, 0]; // Default coords if missing or invalid

             // Infer status if missing, based on availability
            const status = data.status ?? (available > 0 ? 'Operativa' : 'Sin Paraguas');

            if (coords[0] === 0 && coords[1] === 0 && data.coords) {
                 console.warn(`Station ${doc.id} (${name}) has potentially invalid GeoPoint data:`, data.coords);
            }

            return {
                id: doc.id,
                name: name,
                location: location,
                status: status,
                available: available,
                coords: coords,
            };
        });

        console.log(`Successfully mapped ${stationsData.length} stations.`);
        return NextResponse.json(stationsData, { status: 200 });

    } catch (error: unknown) { // Catch unknown type
        console.error("------------------------------------------");
        console.error("!!! Error fetching stations from Firestore !!!");
        console.error("Timestamp:", new Date().toISOString());

        // Type guard for FirebaseError
        const firebaseError = error as FirebaseError;
        if (firebaseError.code) {
             console.error("Firebase Error Code:", firebaseError.code);
             console.error("Firebase Error Message:", firebaseError.message);
             console.error("Firebase Error Stack:", firebaseError.stack);
        } else if (error instanceof Error) {
             console.error("Generic Error Message:", error.message);
             console.error("Generic Error Stack:", error.stack);
        } else {
             console.error("Unknown Error:", error);
        }
         console.error("------------------------------------------");

        // Return a more informative error response
        return NextResponse.json(
            {
                message: "Error interno del servidor al obtener estaciones.",
                errorDetails: error instanceof Error ? error.message : 'Unknown error occurred',
                 errorCode: firebaseError?.code ?? 'UNKNOWN' // Include Firebase error code if available
            },
            { status: 500 }
        );
    }
}
