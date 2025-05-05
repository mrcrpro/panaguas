
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { DonationForm } from "./donation-form"; // Import the existing form
import { Button } from "../ui/button";
import { Dispatch, SetStateAction } from "react";

interface DonationFormDialogProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    tierTitle: string;
    amountThreshold: number; // Could be used to pre-fill or validate minimum
    priceRange: string; // Display the suggested range
}


export function DonationFormDialog({ isOpen, setIsOpen, tierTitle, amountThreshold, priceRange }: DonationFormDialogProps) {

  // Determine minimum amount based on threshold logic if needed
  // Example: If threshold is 5000 (max for previous tier), min is 5001
   const minAmount = priceRange.startsWith('≤') ? 1 : (amountThreshold && isFinite(amountThreshold) && !priceRange.startsWith('≥') ? (amountThreshold - (priceRange.includes('5.001') ? 4999 : 0)) / 1000 + 0.01 : (priceRange.startsWith('≥') ? 15 : 1));
   // Note: This logic is simplified. Adjust based on exact tier definitions. Needs COP conversion or handle amounts directly.
   // Let's assume DonationForm handles validation based on props or internal logic for simplicity now.

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Realizar Donación - {tierTitle}</DialogTitle>
          <DialogDescription>
             Ingresa el monto que deseas donar. Sugerido para este nivel: {priceRange}. ¡Gracias por tu apoyo!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {/* Embed the DonationForm */}
             <DonationForm
                // Optionally pass props to DonationForm if needed
                // e.g., minimumAmount={minAmount}
                onSuccess={() => setIsOpen(false)} // Close dialog on successful donation
             />
        </div>
         {/* Footer might not be needed if the form has its own submit button */}
         {/* <DialogFooter>
             <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
         </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
