
"use client";

import React, { useEffect, useRef, memo } from 'react';
import 'leaflet/dist/leaflet.css';
import L, { type Map, type Marker, type LayerGroup } from 'leaflet'; // Import specific types

// Define Station type matching the expected props
interface Station {
    id: string;
    name: string;
    location: string;
    availableUmbrellas: number; // Renamed for clarity in popup
    coords: [number, number];
    capacity: number; // Added capacity
    status: string; // Added status
}

interface MapComponentProps {
    stations: Station[]; // Accept stations as props
}

// Fix default icon path issue with Webpack/Next.js
// See: https://github.com/PaulLeCam/react-leaflet/issues/453
// Or: https://github.com/Leaflet/Leaflet/issues/4968
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png', // Ensure these paths are correct relative to /public
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}


const MapComponent: React.FC<MapComponentProps> = ({ stations }) => {
    const mapRef = useRef<Map | null>(null); // Ref to store the map instance
    const markersRef = useRef<LayerGroup | null>(null); // Ref to store markers layer group

     const mapContainerRef = useRef<HTMLDivElement>(null); // Ref for the map container div


     // Function to determine icon color based on availability/status
     const getMarkerIcon = (available: number, capacity: number, status: string): L.Icon => {
         let iconUrl = '/leaflet/marker-icon-grey.png'; // Default/Error/Unknown status
         const percentage = capacity > 0 ? (available / capacity) * 100 : 0;

         if (status !== 'Operativa') {
            iconUrl = '/leaflet/marker-icon-red.png'; // Not operational (red)
         } else if (available <= 0) {
             iconUrl = '/leaflet/marker-icon-orange.png'; // Operational but empty (orange)
         } else if (percentage <= 30) {
             iconUrl = '/leaflet/marker-icon-yellow.png'; // Low availability (yellow)
         } else {
             iconUrl = '/leaflet/marker-icon-green.png'; // Good availability (green) - Use default blue or custom green
         }


         return new L.Icon({
             iconUrl: iconUrl,
             iconRetinaUrl: iconUrl.replace('.png', '-2x.png'), // Assume a @2x version exists
             shadowUrl: '/leaflet/marker-shadow.png',
             iconSize: [25, 41],
             iconAnchor: [12, 41],
             popupAnchor: [1, -34],
             shadowSize: [41, 41],
         });
    };


    // Initialize map effect
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) { // Check if container exists and map not initialized
             console.log("Initializing Leaflet map...");
            // Default center (e.g., Uniandes) and zoom level
            const defaultCenter: [number, number] = [4.6027, -74.0659];
            const defaultZoom = 16;

            mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, defaultZoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

             // Initialize the layer group for markers
             markersRef.current = L.layerGroup().addTo(mapRef.current);
             console.log("Leaflet map initialized.");
        }

        // Cleanup function to remove map instance on component unmount
        return () => {
            if (mapRef.current) {
                console.log("Removing Leaflet map instance.");
                mapRef.current.remove();
                mapRef.current = null; // Clear the ref
                 markersRef.current = null; // Clear markers ref
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount/unmount


    // Update markers effect when stations data changes
    useEffect(() => {
        if (mapRef.current && markersRef.current && stations) {
             console.log(`Updating ${stations.length} markers...`);
            // Clear existing markers efficiently
            markersRef.current.clearLayers();

            // Add new markers based on the stations prop
            stations.forEach(station => {
                 if (station.coords && station.coords.length === 2) {
                    const markerIcon = getMarkerIcon(station.availableUmbrellas, station.capacity, station.status);
                    const marker = L.marker(station.coords, { icon: markerIcon })
                        .bindPopup(`<b>${station.name}</b><br>${station.location}<br>Disponibles: ${station.availableUmbrellas}/${station.capacity}<br>Estado: ${station.status}`);
                     markersRef.current?.addLayer(marker); // Add marker to the layer group
                } else {
                    console.warn(`Station ${station.id} (${station.name}) missing or invalid coordinates.`);
                }
            });
             console.log("Markers updated.");

             // Optional: Adjust map bounds to fit markers if stations list is not empty
             if (stations.length > 0) {
                const validCoords = stations.filter(s => s.coords).map(s => s.coords as L.LatLngExpression);
                if (validCoords.length > 0) {
                    // mapRef.current.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50] }); // Add padding
                }
             }
        }
    }, [stations]); // Rerun this effect when the stations array changes

    // Render the map container div
    // Use a fixed height or ensure its parent provides a height
    return <div ref={mapContainerRef} style={{ height: '400px', width: '100%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />;
};

// Memoize the component to prevent unnecessary re-renders if props haven't changed
export default memo(MapComponent);
