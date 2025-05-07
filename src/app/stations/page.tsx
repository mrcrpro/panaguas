
"use client"; // Needs client-side hooks for data fetching and dynamic imports

import { useQuery } from '@tanstack/react-query';
import { Umbrella, Building, Loader2, AlertTriangle, Info, MapPin } from 'lucide-react'; // Added Info and MapPin icons
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import dynamic from 'next/dynamic'; // Import dynamic
import React, { Suspense } from 'react'; // Import Suspense

// Define Station type (matching the API response)
interface Station {
  id: string;
  name: string;
  location: string;
  status: string;
  available: number;
  capacity: number;
  coords?: [number, number]; // Keep coords for potential future use
}

// Dynamically import the MapComponent with a loading fallback
const MapComponent = dynamic(() => import('@/components/map/map-component'), {
  ssr: false, // Leaflet typically needs the browser environment
  loading: () => (
    <div className="flex justify-center items-center h-[400px] bg-muted rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando mapa...</p>
    </div>
    )
});


// Function to fetch station data (ensure this is optimized on the backend)
const fetchStations = async (): Promise<Station[]> => {
    console.log("Fetching stations from /api/stations...");
    // Added cache: 'no-store' to ensure fresh data, but consider if caching is desired
    const response = await fetch('/api/stations', { cache: 'no-store' });
    console.log("Fetch response status:", response.status);
    if (!response.ok) {
        const errorData = await response.text(); // Get more error details
        console.error("Failed to fetch stations:", response.status, response.statusText, errorData);
        // Attempt to parse for structured error, fallback to text
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
         // Basic check if errorData looks like HTML
        if (errorData.trim().startsWith('<')) {
             errorMessage += " - Server returned an HTML error page instead of JSON.";
        } else {
             try {
                 const parsedError = JSON.parse(errorData);
                 errorMessage = parsedError.message || parsedError.errorDetails || errorData;
             } catch (e) {
                 // Use raw errorData if JSON parsing fails or it's not JSON
                 errorMessage += ` - ${errorData}`;
             }
        }

         throw new Error(`Failed to fetch stations: ${errorMessage}`);
    }
    const data: Station[] = await response.json();
     console.log("Stations data received:", data);
    return data;
};


export default function StationsPage() {
    const { data: stations = [], isLoading, error, isError } = useQuery<Station[], Error>({
        queryKey: ['stations'],
        queryFn: fetchStations,
        // Reduce staleTime for more frequent updates if needed, but consider backend load
        staleTime: 1000 * 60 * 1, // 1 minute stale time
        refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    });


   const getStatusColor = (status: string, available: number) => {
     if (status !== 'Operativa') return 'text-red-500 dark:text-red-400';
     if (available > 0) return 'text-green-600 dark:text-green-400';
     return 'text-yellow-500 dark:text-yellow-400'; // Empty but operational
   };

   const workInProgressMessage = "Estamos trabajando en esto para brindarte un mejor servicio, te contactaremos en caso de noticias.";

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4"> {/* Added container for padding */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Estaciones PanAguas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Consulta la ubicación y disponibilidad de paraguas en las diferentes estaciones del campus.
          </p>
        </div>


         {/* Loading Skeletons */}
         {isLoading && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                             <Skeleton className="h-2 w-full" /> {/* Skeleton for Progress bar */}
                        </CardContent>
                     </Card>
                 ))}
            </div>
         )}

         {/* Error Message or No Stations Found Message */}
         {isError && ( // Display only when there is an actual error
             <Alert variant="destructive" className="max-w-2xl mx-auto bg-destructive/10 border-destructive/30 mb-12">
                 <AlertTriangle className="h-4 w-4 text-destructive" />
                 <AlertTitle className="text-destructive">Error al Cargar Estaciones</AlertTitle>
                 <AlertDescription className="text-destructive/90">
                      {workInProgressMessage}
                     {/* Optionally log the technical error to console for debugging */}
                     {error && console.error("Station fetch error:", error.message)}
                 </AlertDescription>
             </Alert>
         )}

         {/* No Stations Found Message (when not loading and no error, but array is empty) */}
          {!isLoading && !isError && stations.length === 0 && (
            <Alert variant="default" className="max-w-2xl mx-auto bg-muted/50 border-border mb-12">
                 <Info className="h-4 w-4" />
                 <AlertTitle>Información</AlertTitle>
                 <AlertDescription>
                     {workInProgressMessage}
                 </AlertDescription>
             </Alert>
          )}


         {/* Station List */}
         {!isLoading && !isError && stations.length > 0 && (
             <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {stations.map((station) => (
                    <Card key={station.id} className="shadow-sm hover:shadow-md transition-shadow border border-border">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <Building className="mr-3 h-5 w-5 text-secondary flex-shrink-0" />
                                {station.name}
                            </CardTitle>
                            <CardDescription className="flex items-center text-sm pt-1">
                                <MapPin className="mr-1.5 h-4 w-4 text-muted-foreground flex-shrink-0"/>
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
                                    value={(station.capacity > 0 ? (station.available / station.capacity) : 0) * 100} // Avoid division by zero
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

                 {/* Map Section - Conditionally render if stations have coordinates */}
                 <div className="mt-12 pt-8 border-t">
                    <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-6 text-center">Ubicación en el Campus</h2>
                     {/* Wrap MapComponent in Suspense */}
                     <Suspense fallback={
                        <div className="flex justify-center items-center h-[400px] bg-muted rounded-md">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                             <p className="ml-2 text-muted-foreground">Cargando mapa...</p>
                        </div>
                        }>
                        <MapComponent stations={stations.filter(s => s.coords)} /> {/* Pass filtered stations */}
                     </Suspense>
                 </div>
             </>
         )}
        </div> {/* Close container div */}
    </section>
  );
}

