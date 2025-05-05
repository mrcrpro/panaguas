
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { processDonation, type Donation } from "@/services/donation";

// Assuming donation amounts are in COP now based on donation page context
const donationSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)), // Convert empty string to undefined, otherwise number
    z.number().positive({ message: "El monto debe ser positivo." }).min(1000, { message: "El monto mínimo es $1.000 COP." }) // Example minimum in COP
  ),
});

type DonationFormValues = z.infer<typeof donationSchema>;

interface DonationFormProps {
    onSuccess?: () => void; // Optional callback for success
    minimumAmount?: number; // Optional minimum amount prop
}


export function DonationForm({ onSuccess, minimumAmount }: DonationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();

   // Adjust schema dynamically if minimumAmount is passed
    const currentSchema = minimumAmount
    ? z.object({
        amount: z.preprocess(
            (val) => (val === "" ? undefined : Number(val)),
             z.number().positive({ message: "El monto debe ser positivo." }).min(minimumAmount, { message: `El monto mínimo para este nivel es $${minimumAmount.toLocaleString()} COP.` })
        ),
     })
    : donationSchema;


  const form = useForm<DonationFormValues>({
    resolver: zodResolver(currentSchema), // Use potentially adjusted schema
    defaultValues: {
      amount: undefined, // Set initial value to undefined
    },
  });

  const handleDonation = async (values: DonationFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
       // Assuming processDonation expects USD, convert if needed, or update service
       // For now, we pass the COP amount directly. Service needs to handle it.
      const donationData: Donation = { amount: values.amount }; // Pass COP amount
      const result = await processDonation(donationData); // Service needs to handle COP or convert

      if (result) {
        setSuccess(true);
        toast({
          title: "Donación Exitosa",
           description: `Gracias por tu donación de $${values.amount.toLocaleString()} COP.`, // Format for COP
        });
        form.reset(); // Reset form on success
        onSuccess?.(); // Call the success callback if provided
      } else {
        throw new Error("La procesadora de donaciones falló.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Ocurrió un error al procesar la donación.";
      setError(errorMessage);
      console.error("Donation processing error:", err);
       toast({
        title: "Error en la Donación",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleDonation)} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="transition-opacity duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && !error && ( // Only show success if no error occurred during the process
         <Alert variant="default" className="bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200 transition-opacity duration-300">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>¡Donación procesada exitosamente!</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="amount">Monto de la Donación (COP)</Label> {/* Updated label */}
        <Input
          id="amount"
          type="number"
          step="1" // Allow whole COP amounts
          placeholder="Ej: 10000" // Updated placeholder for COP
          {...form.register("amount")}
          disabled={loading}
          className="transition-colors duration-200 focus:border-primary"
        />
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full transition-transform duration-200 active:scale-95 bg-primary hover:bg-primary/90" disabled={loading}>
        {loading ? "Procesando..." : "Donar Ahora"}
      </Button>
    </form>
  );
}
