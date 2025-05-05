
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DonationFormDialog } from "./donation-form-dialog"; // Import the dialog form


interface DonationCardProps {
  title: string;
  description: string;
  price?: string; // For free plan
  priceRange?: string; // For donation tiers
  amountThreshold?: number; // Used by the dialog
  features: string[];
  highlight?: boolean;
  cta: string;
  link?: string; // For non-donation CTAs like 'Register'
}

export function DonationCard({
  title,
  description,
  price,
  priceRange,
  amountThreshold,
  features,
  highlight = false,
  cta,
  link
}: DonationCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);


    const handleCTAClick = () => {
        if (link) {
            // If it's a link (like register), navigate
            window.location.href = link; // Or use Next router if preferred
        } else {
             // If it's a donation button, open the dialog
             setIsDialogOpen(true);
        }
    };

  return (
    <>
    <Card className={cn(
      "flex flex-col h-full shadow-sm border transition-all duration-300",
      highlight ? "border-primary ring-2 ring-primary/50 shadow-lg scale-[1.02]" : "border-muted",
      "hover:shadow-md"
    )}>
      <CardHeader className={cn("pb-4", highlight ? "bg-primary/5" : "")}>
        {highlight && (
            <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Recomendado</div>
        )}
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
         <CardDescription className="min-h-[40px]">{description}</CardDescription> {/* Ensure consistent height */}
        <div className="mt-4">
            {price && <span className="text-4xl font-bold">{price}</span>}
            {priceRange && <span className="text-2xl font-bold">{priceRange}</span>}
            {priceRange && <span className="text-sm text-muted-foreground"> / Donación única</span>}
            {price && <span className="text-sm text-muted-foreground"> / Siempre</span>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-4"> {/* Use flex-grow to push footer down */}
        <ul className="space-y-2 text-sm">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
         <Button
            onClick={handleCTAClick}
            className={cn(
              "w-full rounded-full",
              highlight ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/90",
              "text-white" // Ensure text is white for both primary/secondary
            )}
          >
            {cta === 'Donar' && <Gift className="mr-2 h-4 w-4" />}
            {cta}
        </Button>
      </CardFooter>
    </Card>

     {/* Donation Dialog - only rendered when needed */}
     {cta === 'Donar' && amountThreshold !== undefined && (
         <DonationFormDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            tierTitle={title}
            amountThreshold={amountThreshold}
            priceRange={priceRange || ''}
         />
      )}
     </>
  );
}
