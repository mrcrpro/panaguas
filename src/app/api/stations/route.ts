
import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase/admin-config'; // Use Admin SDK

export const dynamic = 'force-dynamic' // Ensure fresh data on each request

// Define the structure of a station document from Firestore
interface StationDoc {
    name?: string;
    location?: string;
    status?: string; // Assuming status is stored directly
    availableUmbrellas?: number;
    coords?: { _latitude: number; _longitude: number }; // Firestore GeoPoint structure
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
        console.log("Fetching stations data from Firestore...");
        const stationsRef = firestoreAdmin.collection('stations');
        const snapshot = await stationsRef.get();

        if (snapshot.empty) {
            console.log("No station documents found.");
            return NextResponse.json([], { status: 200 });
        }

        const stationsData: StationAPIResponse[] = snapshot.docs.map(doc => {
            const data = doc.data() as StationDoc;
            // Provide default values for potentially missing fields
            const available = data.availableUmbrellas ?? 0;
            const coords = data.coords ? [data.coords._latitude, data.coords._longitude] : [0, 0]; // Default coords if missing
            const status = data.status ?? (available > 0 ? 'Operativa' : 'Sin Paraguas'); // Infer status if missing

            return {
                id: doc.id,
                name: data.name ?? 'Nombre Desconocido',
                location: data.location ?? 'Ubicación Desconocida',
                status: status, // Use fetched or inferred status
                available: available,
                coords: coords as [number, number], // Assert the type after check
            };
        });

        console.log(`Successfully fetched ${stationsData.length} stations.`);
        return NextResponse.json(stationsData, { status: 200 });

    } catch (error) {
        console.error("Error fetching stations:", error);
        return NextResponse.json({ message: "Error fetching station data" }, { status: 500 });
    }
}
