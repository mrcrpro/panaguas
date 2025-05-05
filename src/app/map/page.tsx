
import { MapPin, Umbrella } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MapComponent from '@/components/map/map-component'; // Import the MapComponent

// Define Station type (matching the one in map-component.tsx)
interface Station {
  id: number;
  name: string;
  location: string;
  status: string;
  available: number;
  coords: [number, number]; // Add coordinates field
}


export default function MapPage() {
  // Placeholder data for stations - Replace with actual data fetching
  // Added approximate coordinates for Uniandes locations
   const stations: Station[] = [
    { id: 1, name: 'Estación SD', location: 'Edificio Santo Domingo', status: 'Operativa', available: 5, coords: [4.6036, -74.0653] }, // Approx. coords
    { id: 2, name: 'Estación ML', location: 'Edificio Mario Laserna', status: 'Mantenimiento', available: 0, coords: [4.6020, -74.0650] }, // Approx. coords
    { id: 3, name: 'Estación W', location: 'Entrada Edificio W', status: 'Operativa', available: 8, coords: [4.6015, -74.0665] }, // Approx. coords
    { id: 4, name: 'Estación Lleras', location: 'Plazoleta Lleras', status: 'Operativa', available: 3, coords: [4.6028, -74.0668] }, // Approx. coords
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Mapa de Estaciones PanAguas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra la estación de PanAguas más cercana en el campus.
          </p>
        </div>

        {/* Interactive Map */}
        <Card className="mb-12 overflow-hidden shadow-lg border-secondary">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-secondary flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Campus Universitario - Ubicación de Estaciones
            </CardTitle>
             <CardDescription>Haz clic en un marcador para ver detalles.</CardDescription>
          </CardHeader>
           <CardContent className="p-0"> {/* Remove padding for map */}
             {/* Use the MapComponent */}
             <MapComponent stations={stations} />
          </CardContent>
        </Card>

        {/* List of Stations (Fallback or additional info) */}
        <h2 className="text-2xl font-semibold text-center mb-6 text-secondary">Listado de Estaciones</h2>
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
                   <Umbrella className={`mr-2 h-4 w-4 ${station.status === 'Operativa' ? 'text-blue-500' : 'text-muted-foreground'}`}/>
                   Paraguas disponibles: {station.status === 'Operativa' ? station.available : 'N/A'}
                 </p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}

