
"use client"; // For potential scroll animations

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanLine, Umbrella, ChevronsRight, Undo2 } from "lucide-react"; // Using relevant icons
import Image from "next/image";

// Placeholder Step data structure
const steps = [
  {
    icon: ScanLine,
    title: "1. Identifícate",
    description: "Acércate a una estación PanAguas y escanea tu carné Uniandes en el lector.",
    image: "https://picsum.photos/seed/scan-card/400/300",
    aiHint: "student scanning ID card machine",
  },
  {
    icon: Umbrella,
    title: "2. Retira tu Paraguas",
    description: "Una vez identificado, la máquina dispensará automáticamente un paraguas para tu uso.",
    image: "https://picsum.photos/seed/get-umbrella/400/300",
    aiHint: "hand taking umbrella vending machine",
  },
  {
    icon: Undo2,
    title: "3. Devuélvelo a Tiempo",
    description: "Disfruta del paraguas y devuélvelo en cualquier estación PanAguas antes de que expire tu tiempo de préstamo.",
    image: "https://picsum.photos/seed/return-umbrella/400/300",
    aiHint: "person returning umbrella machine rain",
  },
];

export function HowItWorksSection() {
  // Optional: Add Framer Motion or ScrollReveal for animations later
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">¿Cómo Funciona PanAguas?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Usar PanAguas es rápido y sencillo. Sigue estos simples pasos:
          </p>
        </div>

        <div className="relative">
            {/* Connecting line (visual flair) - adjust positioning as needed */}
             <div className="absolute left-1/2 top-10 bottom-10 w-px bg-border -translate-x-1/2 hidden md:block" aria-hidden="true"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center md:text-left md:items-start group">
                     {/* Step Icon and Number */}
                    <div className="relative z-10 mb-4">
                        <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg mb-2 w-16 h-16 flex items-center justify-center border-4 border-background">
                            <step.icon className="h-8 w-8" />
                        </div>
                         {/* Connecting line point removed */}
                    </div>


                    <Card className="w-full bg-card border hover:shadow-lg transition-shadow duration-300">
                       <CardHeader>
                         {/* Optional: Step Image/Illustration */}
                         <div className="mb-4 rounded-md overflow-hidden aspect-video relative">
                           <Image
                             src={step.image}
                             alt={`Paso ${index + 1}: ${step.title}`}
                             layout="fill"
                             objectFit="cover"
                             className="group-hover:scale-105 transition-transform duration-300"
                             data-ai-hint={step.aiHint}
                           />
                         </div>
                         <CardTitle className="text-xl font-semibold text-primary">{step.title}</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <p className="text-muted-foreground">{step.description}</p>
                       </CardContent>
                    </Card>
                 </div>
            ))}
            </div>
        </div>
      </div>
    </section>
  );
}

