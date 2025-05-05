
"use client"; // For potential dynamic data fetching or animations

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Umbrella, Droplets, Leaf } from "lucide-react"; // Relevant icons
import { useState, useEffect } from 'react'; // For potential animations

// Placeholder data - Replace with actual data source later
const impactData = {
  users: 1250, // Example number
  loans: 5320,
  waterSaved: 800, // Example in Liters (hypothetical metric)
};

export function ImpactSection() {
    // Optional: Add state for count-up animations
    const [animatedUsers, setAnimatedUsers] = useState(0);
    const [animatedLoans, setAnimatedLoans] = useState(0);
    const [animatedWater, setAnimatedWater] = useState(0);

     useEffect(() => {
        // Simple count-up logic (replace with a library like react-countup if desired)
        const duration = 1500; // Animation duration in ms
        const usersInterval = setInterval(() => {
        setAnimatedUsers((prev) => {
            const next = prev + Math.ceil(impactData.users / (duration / 50));
            return next >= impactData.users ? impactData.users : next;
        });
        }, 50);
        const loansInterval = setInterval(() => {
        setAnimatedLoans((prev) => {
            const next = prev + Math.ceil(impactData.loans / (duration / 50));
            return next >= impactData.loans ? impactData.loans : next;
        });
        }, 50);
         const waterInterval = setInterval(() => {
        setAnimatedWater((prev) => {
            const next = prev + Math.ceil(impactData.waterSaved / (duration / 50));
            return next >= impactData.waterSaved ? impactData.waterSaved : next;
        });
        }, 50);


        // Clear intervals when component unmounts or values are reached
        setTimeout(() => {
            clearInterval(usersInterval);
            clearInterval(loansInterval);
            clearInterval(waterInterval);
             // Ensure final values are set
            setAnimatedUsers(impactData.users);
            setAnimatedLoans(impactData.loans);
            setAnimatedWater(impactData.waterSaved);
        }, duration + 100);


         return () => {
            clearInterval(usersInterval);
            clearInterval(loansInterval);
            clearInterval(waterInterval);
        };
    }, []); // Empty dependency array ensures this runs once on mount


  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-green-50 dark:from-green-900/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-400 mb-4">Nuestro Impacto en Uniandes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PanAguas no es solo conveniencia, es comunidad y sostenibilidad.
          </p>
        </div>

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
      </div>
    </section>
  );
}
