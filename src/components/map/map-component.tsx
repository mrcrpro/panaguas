
"use client";

import type { LegacyRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
// Dynamically import leaflet only on client-side
// import L from 'leaflet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

// Define Station type (matching the one in map/page.tsx and API response)
interface Station {
  id: string; // Use string ID
  name: string;
  location: string;
  status: string;
  available: number;
  coords: [number, number];
}

interface MapComponentProps {
    stations: Station[];
}

// Store Icon instances globally within the client-side scope
let L: typeof import('leaflet') | null = null;
let DefaultIcon: L.Icon | undefined;
let BlueIcon: L.Icon | undefined; // Available
let RedIcon: L.Icon | undefined; // Maintenance / Error
let GrayIcon: L.Icon | undefined; // Empty

const MapComponent = ({ stations }: MapComponentProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]); // Ref to keep track of markers
  const [mapInitialized, setMapInitialized] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

   // --- Load Leaflet and Icons ---
   useEffect(() => {
    if (typeof window !== 'undefined' && !leafletLoaded) {
        import('leaflet').then(leafletModule => {
            L = leafletModule;

             // Fix for default Leaflet icons not loading with Webpack/Next.js
             // Ensure these icon files exist in your public/images/leaflet directory or adjust paths
            try {
                 DefaultIcon = L.icon({
                    iconUrl: '/images/leaflet/marker-icon.png',
                    iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
                    shadowUrl: '/images/leaflet/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });
                 BlueIcon = L.icon({ // Operative & Available
                    iconUrl: '/images/leaflet/marker-icon-blue.png', // Custom blue icon
                    iconRetinaUrl: '/images/leaflet/marker-icon-blue-2x.png',
                    shadowUrl: '/images/leaflet/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });
                 RedIcon = L.icon({ // Maintenance / Error
                    iconUrl: '/images/leaflet/marker-icon-red.png', // Custom red icon
                    iconRetinaUrl: '/images/leaflet/marker-icon-red-2x.png',
                    shadowUrl: '/images/leaflet/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });
                 GrayIcon = L.icon({ // Operative but Empty
                    iconUrl: '/images/leaflet/marker-icon-grey.png', // Custom gray icon
                    iconRetinaUrl: '/images/leaflet/marker-icon-grey-2x.png',
                    shadowUrl: '/images/leaflet/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });
                L.Marker.prototype.options.icon = DefaultIcon; // Set default
                setLeafletLoaded(true);
                 console.log("Leaflet and custom icons loaded.");

            } catch (iconError) {
                 console.error("Error loading Leaflet icons:", iconError);
                 setError("Error al cargar iconos del mapa.");
                 // Proceed without custom icons? DefaultIcon might still work.
                 setLeafletLoaded(true); // Mark as loaded even if icons failed, map might partially work
            }

        }).catch(err => {
            console.error("Failed to load Leaflet dynamically:", err);
            setError("Error al cargar la librería del mapa.");
            setLeafletLoaded(false); // Ensure it stays false on error
        });
    }
   }, [leafletLoaded]); // Run only once or if leafletLoaded changes


  // --- Initialize Map ---
  useEffect(() => {
      // Ensure Leaflet is loaded, the container exists, and map isn't already initialized
     if (leafletLoaded && L && mapContainerRef.current && !mapRef.current) {
        try {
            console.log("Initializing Leaflet map...");
            const mapInstance = L.map(mapContainerRef.current, {
                 center: [4.6027, -74.0659], // Center on Uniandes approx.
                 zoom: 16,
            });
            mapRef.current = mapInstance;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                 maxZoom: 19,
                 attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
             }).addTo(mapInstance);

            setMapInitialized(true);
            setError(null); // Clear previous errors
            console.log("Leaflet map initialized.");

        } catch (initError) {
            console.error("Leaflet map initialization error:", initError);
            setError("No se pudo inicializar el mapa.");
            setMapInitialized(false);
        }
     }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        console.log("Removing Leaflet map instance.");
        mapRef.current.remove();
        mapRef.current = null;
        setMapInitialized(false);
         markersRef.current = []; // Clear marker refs on cleanup
      }
    };
  }, [leafletLoaded]); // Depend on leafletLoaded state


   // --- Update Markers when stations prop changes ---
   useEffect(() => {
        if (!mapInitialized || !L || !mapRef.current) return; // Ensure map is ready
        console.log("Updating markers based on new station data:", stations);


        // 1. Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // 2. Add new markers
        stations.forEach(station => {
            if (!station.coords || station.coords.length !== 2 || station.coords.some(isNaN)) {
                console.warn(`Skipping station ${station.id} (${station.name}) due to invalid coordinates:`, station.coords);
                return;
            }

             let icon = DefaultIcon; // Fallback icon
             if (station.status !== 'Operativa') {
                icon = RedIcon; // Red for non-operational
             } else if (station.available > 0) {
                icon = BlueIcon; // Blue for operational and available
             } else {
                 icon = GrayIcon; // Gray for operational but empty
             }

             try {
                const marker = L.marker(station.coords, { icon: icon || DefaultIcon }) // Use default if specific icon failed to load
                 .addTo(mapRef.current!)
                 .bindPopup(`
                     <div class="font-sans p-1">
                         <strong class="text-lg text-primary block mb-1">${station.name}</strong>
                         <p class="text-sm text-muted-foreground mb-2">${station.location}</p>
                         <hr class="my-1 border-border">
                         <p class="text-sm mb-1">
                             <span class="font-medium">Estado:</span>
                             <span class="${station.status === 'Operativa' ? 'text-green-600' : 'text-red-600'} font-semibold">
                                 ${station.status}
                             </span>
                         </p>
                         ${station.status === 'Operativa' ? `
                         <p class="text-sm">
                             <span class="font-medium">Disponibles:</span>
                             <span class="font-bold text-blue-600">${station.available}</span>
                         </p>
                         ` : ''}
                     </div>
                 `);
                markersRef.current.push(marker); // Add to ref array
             } catch (markerError) {
                 console.error(`Error creating marker for station ${station.id} (${station.name}):`, markerError);
             }
        });

        // Optional: Adjust map view to fit markers if needed
        // if (markersRef.current.length > 0) {
        //     const group = L.featureGroup(markersRef.current);
        //     mapRef.current.fitBounds(group.getBounds().pad(0.1)); // Add padding
        // }


   }, [stations, mapInitialized, L]); // Re-run when stations or map initialization changes


  return (
     <div className="relative border-b border-border" style={{ height: '500px', width: '100%' }}>
        {/* Container for the Leaflet map */}
        <div ref={mapContainerRef} id="map-container-unique-id" style={{ height: '100%', width: '100%', backgroundColor: '#e0e0e0' /* Light grey fallback */ }} />

         {/* Loading Indicator (while Leaflet loads or map initializes) */}
         {(!leafletLoaded || !mapInitialized) && !error && (
             <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-3 text-muted-foreground font-semibold">Cargando Mapa...</p>
            </div>
         )}

          {/* Error Message */}
         {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10 p-4">
                <Alert variant="destructive" className="max-w-sm">
                    <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Error al Cargar Mapa</AlertTitle>
                     <AlertDescription>{error}</AlertDescription>
                 </Alert>
             </div>
         )}
     </div>
   );
};

export default MapComponent;
