
"use client"; // For potential dynamic data fetching or animations

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Umbrella, Droplets, Leaf, Loader2 } from "lucide-react"; // Relevant icons
import { useState, useEffect, useRef } from 'react'; // For animations and listeners
import { doc, onSnapshot } from "firebase/firestore"; // Import Firestore listener
import { db } from "@/lib/firebase/config"; // Import Firestore instance

// Placeholder data - Will be updated from Firestore
interface ImpactData {
  totalUsers: number;
  totalLoans: number;
  totalWaterSaved: number; // Example metric
}

const initialImpactData: ImpactData = {
    totalUsers: 0,
    totalLoans: 0,
    totalWaterSaved: 0,
};


export function ImpactSection() {
    const [impactData, setImpactData] = useState<ImpactData>(initialImpactData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for count-up animations
    const [animatedUsers, setAnimatedUsers] = useState(0);
    const [animatedLoans, setAnimatedLoans] = useState(0);
    const [animatedWater, setAnimatedWater] = useState(0);

    // Ref to store interval IDs for cleanup
    const intervalsRef = useRef<NodeJS.Timeout[]>([]);

     // --- Firestore Real-time Listener ---
     useEffect(() => {
        setLoading(true);
        setError(null);
        console.log("Setting up Firestore listener for system/stats...");

        const statsDocRef = doc(db, "system", "stats");

        const unsubscribe = onSnapshot(statsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                console.log("Received stats update:", docSnap.data());
                 const data = docSnap.data() as Partial<ImpactData>; // Use Partial for safety
                 // Ensure defaults if fields are missing
                 const updatedData: ImpactData = {
                    totalUsers: data.totalUsers ?? 0,
                    totalLoans: data.totalLoans ?? 0,
                    totalWaterSaved: data.totalWaterSaved ?? 0, // Adjust field name if needed
                 };
                setImpactData(updatedData);
                setLoading(false);
            } else {
                 console.warn("System stats document does not exist!");
                 // Set to initial state or show specific message
                 setImpactData(initialImpactData);
                 setError("No se pudieron cargar las estadísticas.");
                 setLoading(false);
            }
        }, (err) => {
            console.error("Error listening to system stats:", err);
            setError("Error al cargar estadísticas en tiempo real.");
            setImpactData(initialImpactData);
            setLoading(false);
        });

        // Cleanup listener on component unmount
        return () => {
            console.log("Cleaning up Firestore listener.");
            unsubscribe();
             // Clear any running animation intervals
            intervalsRef.current.forEach(clearInterval);
            intervalsRef.current = [];
        };
    }, []); // Run only once on mount

     // --- Count-up Animation Logic ---
     useEffect(() => {
        // Clear previous intervals when impactData changes
        intervalsRef.current.forEach(clearInterval);
        intervalsRef.current = [];

        if (loading || error) return; // Don't run animation if loading or error

        const duration = 1500; // Animation duration in ms
        const steps = 30; // Number of steps for smoother animation
        const stepDuration = duration / steps;

        const animateValue = (
            targetValue: number,
            setter: React.Dispatch<React.SetStateAction<number>>
        ) => {
             const startValue = 0; // Always start from 0 for simplicity
             const increment = (targetValue - startValue) / steps;
             let currentValue = startValue;

             const intervalId = setInterval(() => {
                currentValue += increment;
                 if ((increment > 0 && currentValue >= targetValue) || (increment < 0 && currentValue <= targetValue) || increment === 0) {
                    setter(targetValue); // Set final value precisely
                    clearInterval(intervalId);
                } else {
                     setter(Math.ceil(currentValue)); // Use ceil for integer display
                }
             }, stepDuration);
            intervalsRef.current.push(intervalId); // Store interval ID for cleanup
         };

        animateValue(impactData.totalUsers, setAnimatedUsers);
        animateValue(impactData.totalLoans, setAnimatedLoans);
        animateValue(impactData.totalWaterSaved, setAnimatedWater);


         // Cleanup function for this specific effect run
         return () => {
             intervalsRef.current.forEach(clearInterval);
             intervalsRef.current = [];
         };

    }, [impactData, loading, error]); // Re-run animation when data changes


  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-green-50 dark:from-green-900/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-400 mb-4">Nuestro Impacto en Uniandes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             {loading
                 ? "Cargando estadísticas..."
                 : error
                 ? error
                 : "PanAguas no es solo conveniencia, es comunidad y sostenibilidad."}
          </p>
        </div>

         {loading ? (
             <div className="flex justify-center items-center h-40">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Impact Card: Usuarios */}
            <Card className="text-center border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-col items-center pb-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full p-3 mb-3">
                    <Users className="h-8 w-8" />
                </div>
                <CardTitle className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                    {animatedUsers.toLocaleString()} {/* Use animated value */}
                </CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground font-medium">Usuarios Registrados</p>
                </CardContent>
            </Card>

            {/* Impact Card: Préstamos */}
            <Card className="text-center border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-col items-center pb-4">
                <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full p-3 mb-3">
                    <Umbrella className="h-8 w-8" />
                </div>
                <CardTitle className="text-4xl font-bold text-green-700 dark:text-green-300">
                    {animatedLoans.toLocaleString()} {/* Use animated value */}
                </CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground font-medium">Paraguas Prestados</p>
                </CardContent>
            </Card>

            {/* Impact Card: Sostenibilidad (Example) */}
            <Card className="text-center border-teal-200 dark:border-teal-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-col items-center pb-4">
                <div className="bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full p-3 mb-3">
                    <Leaf className="h-8 w-8" /> {/* Or Droplets */}
                </div>
                <CardTitle className="text-4xl font-bold text-teal-700 dark:text-teal-300">
                    +{animatedWater.toLocaleString()} L {/* Use animated value */}
                </CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground font-medium">Menos Paraguas Desechables (Estimado)</p>
                {/* <p className="text-muted-foreground font-medium">Litros de Agua Evitados (Ej. por no comprar botellas)</p> */}
                </CardContent>
            </Card>
            </div>
         )}
      </div>
    </section>
  );
}
