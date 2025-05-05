
"use client"; // Needs client-side hooks for data fetching and map rendering

import { useEffect, useState } from 'react';
import { MapPin, Umbrella, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MapComponent from '@/components/map/map-component'; // Import the MapComponent
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// Define Station type (matching the API response and MapComponent prop)
interface Station {
  id: string; // Use string ID from Firestore/API
  name: string;
  location: string;
  status: string;
  available: number;
  coords: [number, number];
}


export default function MapPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


   useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/stations'); // Fetch from the new API route
        if (!response.ok) {
          throw new Error(`Failed to fetch stations: ${response.statusText}`);
        }
        const data: Station[] = await response.json();
        setStations(data);
      } catch (err: any) {
        console.error("Error fetching stations:", err);
        setError(err.message || "No se pudieron cargar las estaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []); // Empty dependency array to fetch once on mount

  return (
    <section className="py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Mapa de Estaciones PanAguas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra la estación de PanAguas más cercana y verifica la disponibilidad de paraguas en el campus.
          </p>
        </div>

        {/* Interactive Map */}
        <Card className="mb-12 overflow-hidden shadow-lg border-secondary">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-secondary flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Campus Universitario - Ubicación de Estaciones
            </CardTitle>
             <CardDescription>Haz clic en un marcador para ver detalles y disponibilidad.</CardDescription>
          </CardHeader>
           <CardContent className="p-0">
              {/* Conditionally render MapComponent or loading/error states */}
             {loading && (
                <div className="relative border rounded-lg overflow-hidden shadow-md" style={{ height: '500px', width: '100%' }}>
                    <Skeleton className="h-full w-full" />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         <p className="ml-3 text-muted-foreground font-semibold">Cargando Mapa y Estaciones...</p>
                    </div>
                </div>
             )}
             {error && !loading && (
                 <div className="relative border rounded-lg overflow-hidden shadow-md bg-destructive/10 text-destructive" style={{ height: '500px', width: '100%' }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                         <AlertTriangle className="h-10 w-10 mb-4" />
                         <p className="font-semibold mb-2">Error al cargar el mapa</p>
                         <p className="text-sm">{error}</p>
                     </div>
                 </div>
             )}
             {!loading && !error && (
                <MapComponent stations={stations} />
             )}
          </CardContent>
        </Card>

        {/* List of Stations (Fallback or additional info) */}
        <h2 className="text-2xl font-semibold text-center mb-6 text-secondary">Listado de Estaciones</h2>

         {/* Loading Skeletons for List */}
         {loading && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(4)].map((_, i) => (
                     <Card key={i}>
                        <CardHeader>
                             <Skeleton className="h-6 w-3/4 mb-2" />
                             <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                     </Card>
                 ))}
            </div>
         )}

         {/* Error Message for List */}
         {error && !loading && (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Error al Cargar Lista</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
             </Alert>
         )}


         {/* Actual Station List */}
         {!loading && !error && stations.length === 0 && (
             <p className="text-center text-muted-foreground">No se encontraron estaciones.</p>
         )}
         {!loading && !error && stations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
                <Card key={station.id} className={`border ${station.status === 'Operativa' ? 'border-green-500/50 dark:border-green-600/60' : 'border-destructive/50'}`}>
                <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                        {station.name}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${station.status === 'Operativa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {station.status}
                        </span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{station.location}</p>
                </CardHeader>
                <CardContent>
                    <p className="text-sm flex items-center">
                    <Umbrella className={`mr-2 h-4 w-4 ${station.status === 'Operativa' && station.available > 0 ? 'text-blue-500' : 'text-muted-foreground'}`}/>
                    Paraguas disponibles: {station.status === 'Operativa' ? station.available : 'N/A'}
                    </p>
                </CardContent>
                </Card>
            ))}
            </div>
         )}
    </section>
  );
}
