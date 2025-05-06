
"use client"; // Needs client-side hooks for data fetching

import { useQuery } from '@tanstack/react-query';
import { Umbrella, Building, Loader2, AlertTriangle, Info } from 'lucide-react'; // Added Info icon
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
  coords?: [number, number]; // Keep coords for potential future use
}

// Function to fetch station data
const fetchStations = async (): Promise<Station[]> => {
    console.log("Fetching stations from /api/stations...");
    const response = await fetch('/api/stations');
    console.log("Fetch response status:", response.status);
    if (!response.ok) {
        const errorData = await response.text(); // Get more error details
        console.error("Failed to fetch stations:", response.status, response.statusText, errorData);
        // Attempt to parse for structured error, fallback to text
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
             const parsedError = JSON.parse(errorData);
             errorMessage = parsedError.message || parsedError.errorDetails || errorData;
        } catch (e) {
             // Use raw errorData if JSON parsing fails
             errorMessage += ` - ${errorData}`;
        }

         throw new Error(errorMessage);
    }
    const data: Station[] = await response.json();
     console.log("Stations data received:", data);
    return data;
};


export default function StationsPage() {
    const { data: stations = [], isLoading, error, isError } = useQuery<Station[], Error>({
        queryKey: ['stations'], // Unique key for this query
        queryFn: fetchStations, // The function to fetch data
        // Optional: Configure refetch intervals, stale time, etc.
        // refetchInterval: 1000 * 60, // Refetch every minute
    });


   const getStatusColor = (status: string, available: number) => {
     if (status !== 'Operativa') return 'text-red-500 dark:text-red-400';
     if (available > 0) return 'text-green-600 dark:text-green-400';
     return 'text-yellow-500 dark:text-yellow-400'; // Empty but operational
   };

   const workInProgressMessage = "Estamos trabajando en esto para brindarte un mejor servicio, te contactaremos en caso de noticias.";

  return (
    <section className="py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Estaciones PanAguas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Consulta la ubicación y disponibilidad de paraguas en las diferentes estaciones del campus.
          </p>
        </div>


         {/* Loading Skeletons */}
         {isLoading && (
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
                             <Skeleton className="h-2 w-full" /> {/* Skeleton for Progress bar */}
                        </CardContent>
                     </Card>
                 ))}
            </div>
         )}

         {/* Error Message or No Stations Found Message */}
         {(isError || (!isLoading && stations.length === 0)) && (
            <Alert variant={isError ? "destructive" : "default"} className="max-w-2xl mx-auto bg-muted/50">
                 {isError ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                 <AlertTitle>{isError ? "Error al Cargar Estaciones" : "Información"}</AlertTitle>
                 <AlertDescription>
                     {workInProgressMessage}
                     {/* Optionally show technical error details in development or behind a toggle */}
                     {/* {isError && process.env.NODE_ENV === 'development' && error && (
                         <p className="text-xs mt-2">Detalles del error: {error.message}</p>
                     )} */}
                     {isError && error && <p className="text-xs mt-2">Detalles del error: {error.message}</p>}
                 </AlertDescription>
             </Alert>
         )}


         {/* Station List */}
         {!isLoading && !isError && stations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
                <Card key={station.id} className="shadow-sm hover:shadow-md transition-shadow border border-border">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                             <Building className="mr-3 h-5 w-5 text-secondary flex-shrink-0" />
                             {station.name}
                         </CardTitle>
                        <CardDescription className="flex items-center text-sm pt-1">
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
         )}
    </section>
  );
}
