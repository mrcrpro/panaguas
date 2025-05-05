
"use client";

import type { LegacyRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Define Station type (matching the one in map/page.tsx)
interface Station {
  id: number;
  name: string;
  location: string;
  status: string;
  available: number;
  coords: [number, number]; // Add coordinates field
}

interface MapComponentProps {
    stations: Station[];
}

// Fix for default Leaflet icons not loading with Webpack/Next.js
// Ensure these icon files exist in your public/images/leaflet directory or adjust paths
let DefaultIcon: L.Icon;
let BlueIcon: L.Icon;
let RedIcon: L.Icon;

if (typeof window !== 'undefined') {
  DefaultIcon = L.icon({
    iconUrl: '/images/leaflet/marker-icon.png',
    iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
    shadowUrl: '/images/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  BlueIcon = L.icon({
    iconUrl: '/images/leaflet/marker-icon-blue.png', // Custom blue icon
    iconRetinaUrl: '/images/leaflet/marker-icon-blue-2x.png',
    shadowUrl: '/images/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

    RedIcon = L.icon({
    iconUrl: '/images/leaflet/marker-icon-red.png', // Custom red icon
    iconRetinaUrl: '/images/leaflet/marker-icon-red-2x.png',
    shadowUrl: '/images/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  L.Marker.prototype.options.icon = DefaultIcon;
}



const MapComponent = ({ stations }: MapComponentProps) => {
  const mapRef = useRef<L.Map | null>(null);
   const [mapInitialized, setMapInitialized] = useState(false);
   const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let mapInstance: L.Map | null = null;

    // Dynamically import Leaflet only on the client-side
     import('leaflet').then(L => {
        // Check if map is already initialized
        if (mapRef.current === null && document.getElementById('map')) {
            try {
              // Create map instance
              mapInstance = L.map('map', {
                center: [4.6027, -74.0659], // Center on Uniandes approx.
                zoom: 16, // Adjust zoom level as needed
              });
              mapRef.current = mapInstance; // Store the instance

              // Add tile layer (OpenStreetMap)
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(mapInstance);


               // Add station markers
               stations.forEach(station => {
                   const icon = station.status === 'Operativa' ? BlueIcon : RedIcon;
                    L.marker(station.coords, { icon })
                    .addTo(mapInstance!)
                    .bindPopup(`
                        <div class="font-sans">
                            <strong class="text-primary">${station.name}</strong><br>
                            ${station.location}<br>
                            <span class="${station.status === 'Operativa' ? 'text-green-600' : 'text-red-600'}">
                                Estado: ${station.status}
                            </span><br>
                             ${station.status === 'Operativa' ? `Disponibles: ${station.available}` : ''}
                        </div>
                    `);
                });


              setMapInitialized(true); // Indicate map is ready
               setError(null); // Clear any previous error

            } catch (err) {
                console.error("Leaflet initialization error:", err);
                setError("No se pudo cargar el mapa. Intenta recargar la página.");
                setMapInitialized(false);
            }

        } else if (mapRef.current) {
             // If map is already initialized, maybe update markers if stations change
             // For now, we just ensure it's marked as initialized
             setMapInitialized(true);
             setError(null);
        }
     }).catch(err => {
         console.error("Failed to load Leaflet:", err);
         setError("Error al cargar la librería del mapa.");
         setMapInitialized(false);
     });


    // Cleanup function to remove map instance when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // Properly removes the map instance
        mapRef.current = null; // Reset the ref
        setMapInitialized(false);
      }
    };
  }, [stations]); // Re-run effect if stations change

  return (
     <div className="relative border rounded-lg overflow-hidden shadow-md" style={{ height: '500px', width: '100%' }}>
         {/* Map container */}
        <div id="map" style={{ height: '100%', width: '100%', backgroundColor: '#e0e0e0' /* Light grey fallback */ }} />

         {/* Loading Skeleton */}
         {!mapInitialized && !error && (
             <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                 <Skeleton className="h-full w-full" />
                 <p className="absolute text-muted-foreground font-semibold">Cargando Mapa...</p>
            </div>
         )}

          {/* Error Message */}
         {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10 p-4">
                <Alert variant="destructive">
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
