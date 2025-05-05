
"use client"; // Needs client-side hooks for data fetching

import { useEffect, useState } from 'react';
import { Umbrella, Building, Sigma, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";


// Define Station type (matching the API response)
interface Station {
  id: string; // Use string ID from Firestore/API
  name: string;
  location: string;
  status: string;
  available: number;
  capacity: number; // Added capacity field
  coords?: [number, number]; // Keep coords for potential future use, but don't display map
}


export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


   useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching stations from /api/stations...");
        const response = await fetch('/api/stations'); // Fetch from the API route
        console.log("Fetch response status:", response.status);
        if (!response.ok) {
            const errorText = await response.text(); // Get error response body as text
            console.error("Failed to fetch stations:", response.status, response.statusText, errorText);
            // Try to parse JSON for more details, otherwise use text
            let errorDetails = errorText;
            try {
                 const errorJson = JSON.parse(errorText);
                 errorDetails = errorJson.message || errorJson.errorDetails || errorText;
            } catch (parseError) {
                 // Ignore parsing error, use the raw text
            }
             throw new Error(`Error ${response.status}: ${response.statusText}. ${errorDetails}`);
        }
        const data: Station[] = await response.json();
        console.log("Stations data received:", data);
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

   const getStatusColor = (status: string, available: number) => {
     if (status !== 'Operativa') return 'text-red-500 dark:text-red-400';
     if (available > 0) return 'text-green-600 dark:text-green-400';
     return 'text-yellow-500 dark:text-yellow-400'; // Empty but operational
   };

  return (
    <section className="py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Estaciones PanAguas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Consulta la ubicación y disponibilidad de paraguas en las diferentes estaciones del campus.
          </p>
        </div>


         {/* Loading Skeletons */}
         {loading && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                     <Card key={i} className="animate-pulse">
                        <CardHeader>
                             <Skeleton className="h-6 w-3/4 mb-2" />
                             <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                     </Card>
                 ))}
            </div>
         )}

         {/* Error Message */}
         {error && !loading && (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Error al Cargar Estaciones</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
             </Alert>
         )}


         {/* Station List */}
         {!loading && !error && stations.length === 0 && (
             <p className="text-center text-muted-foreground">No se encontraron estaciones configuradas.</p>
         )}
         {!loading && !error && stations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
                <Card key={station.id} className="shadow-sm hover:shadow-md transition-shadow border border-border">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                             <Building className="mr-3 h-5 w-5 text-secondary flex-shrink-0" />
                             {station.name}
                         </CardTitle>
                        <CardDescription className="flex items-center text-sm pt-1">
                            {/* Location could be part of name or a separate field */}
                             {station.location}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                             <p className="text-sm font-medium text-muted-foreground mb-1">Disponibilidad:</p>
                            <div className="flex items-center space-x-2">
                                <Umbrella className={`h-5 w-5 ${getStatusColor(station.status, station.available)}`} />
                                <span className="text-lg font-bold text-foreground">
                                     {station.available} / {station.capacity}
                                </span>
                            </div>
                             <Progress
                                value={(station.available / station.capacity) * 100}
                                className="h-2 mt-2"
                                aria-label={`${station.available} de ${station.capacity} paraguas disponibles`}
                             />
                        </div>
                         <div>
                             <p className="text-sm font-medium text-muted-foreground mb-1">Estado:</p>
                             <p className={`text-sm font-semibold ${getStatusColor(station.status, station.available)}`}>
                                {station.status === 'Operativa' && station.available === 0 ? 'Operativa (Sin Paraguas)' : station.status}
                            </p>
                        </div>

                    </CardContent>
                </Card>
            ))}
            </div>
         )}
    </section>
  );
}
