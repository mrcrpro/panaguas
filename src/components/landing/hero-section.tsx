"use client"; // For potential animations or interactions

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image"; // Using next/image for optimization
import { Umbrella, ChevronRight } from "lucide-react"; // Using lucide icons

export function HeroSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-green-50 dark:to-green-900/10 text-center overflow-hidden relative">
        {/* Optional: Parallax background elements */}
        <div className="absolute top-10 left-10 opacity-10 dark:opacity-5 -z-10 animate-pulse">
             <Umbrella className="h-32 w-32 text-blue-200 dark:text-blue-800 transform rotate-12" />
        </div>
         <div className="absolute bottom-10 right-10 opacity-10 dark:opacity-5 -z-10 animate-pulse delay-500">
            <Umbrella className="h-24 w-24 text-green-200 dark:text-green-800 transform -rotate-12" />
        </div>


      <div className="container mx-auto px-4 relative z-10">
        {/* Animated Umbrella Illustration */}
        <div className="mb-8 flex justify-center">
             <Image
                src="https://picsum.photos/seed/panaguas-logo-main/300/300" // Using picsum placeholder, hinting at the actual logo
                alt="Logo de PanAguas - Paraguas dentro de una gota" // Updated alt text
                width={200}
                height={200}
                className="rounded-full shadow-lg animate-bounce-slow" // Simple bounce animation example
                data-ai-hint="umbrella drop logo blue" // Added hint for AI image generation
                priority // Add priority to preload the LCP image
              />
         </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-primary mb-4 drop-shadow-sm">
          PanAguas Uniandes
        </h1>
        <p className="text-xl md:text-2xl text-secondary font-medium mb-8 max-w-3xl mx-auto">
          “Porque en Uniandes, hasta la lluvia es compartida.”
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link href="/login" passHref legacyBehavior>
             <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
                Empieza a usar PanAguas
                <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/#how-it-works" passHref legacyBehavior>
            <Button variant="outline" size="lg" className="rounded-full border-secondary text-secondary hover:bg-secondary/10 shadow-sm transition-transform hover:scale-105">
                Ver cómo funciona
            </Button>
           </Link>
        </div>
      </div>
    </section>
  );
}

// Add simple animation keyframes to globals.css or tailwind.config.js if needed
// Example for tailwind.config.js:
/*
 theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      }
    }
 }
*/
