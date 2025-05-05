
import { MapPin, Umbrella } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MapPage() {
  // Placeholder data for stations - Replace with actual data fetching
  const stations = [
    { id: 1, name: 'Estación SD', location: 'Edificio Santo Domingo', status: 'Operativa', available: 5 },
    { id: 2, name: 'Estación ML', location: 'Edificio Mario Laserna', status: 'Mantenimiento', available: 0 },
    { id: 3, name: 'Estación W', location: 'Entrada Edificio W', status: 'Operativa', available: 8 },
     { id: 4, name: 'Estación Lleras', location: 'Plazoleta Lleras', status: 'Operativa', available: 3 },
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

        {/* Placeholder for Interactive Map or Illustrated Map */}
        <Card className="mb-12 overflow-hidden shadow-lg border-secondary">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-secondary flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Campus Universitario - Ubicación de Estaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Replace with actual map component (e.g., Leaflet, Mapbox GL JS, Google Maps) or an illustration */}
             <div className="relative w-full h-64 md:h-96 bg-muted flex items-center justify-center">
                 {/* Placeholder Image */}
                <Image
                    src="https://picsum.photos/1200/600" // Replace with a campus map illustration URL
                    alt="Mapa del Campus Uniandes con estaciones PanAguas"
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="university campus map illustration"
                 />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                     <p className="text-background text-xl font-semibold p-4 bg-black/50 rounded">
                        Mapa Interactivo Próximamente
                     </p>
                 </div>
                 {/* Example station markers (replace with dynamic markers on a real map) */}
                <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-primary">
                    <Umbrella className="h-8 w-8 drop-shadow-lg"/>
                 </div>
                 <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/2 translate-y-1/2 text-primary">
                    <Umbrella className="h-8 w-8 drop-shadow-lg"/>
                 </div>
                  <div className="absolute top-1/3 right-1/4 transform translate-x-1/2 -translate-y-1/2 text-destructive">
                     <MapPin className="h-8 w-8 drop-shadow-lg"/> {/* Example maintenance marker */}
                 </div>
            </div>
          </CardContent>
        </Card>

        {/* List of Stations (Fallback or additional info) */}
        <h2 className="text-2xl font-semibold text-center mb-6 text-secondary">Listado de Estaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <Card key={station.id} className={`border ${station.status === 'Operativa' ? 'border-green-500' : 'border-destructive/50'}`}>
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
                <p className="text-sm">
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
