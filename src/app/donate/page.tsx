
"use client"; // Needed for the copy button functionality

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Check, Copy, Gift, Info, Mail, Star, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define donation tiers and their benefits concisely based on the provided table
const donationTiersInfo = [
  {
    title: 'Plan Gratuito',
    icon: Star,
    benefit: 'Préstamo estándar de 20 minutos.', // Base time
    color: "text-muted-foreground",
  },
  {
    title: 'Donador Bajo',
    icon: Star,
    benefit: 'Tiempo de préstamo total: 35 minutos (20 base + 15 extra).',
    threshold: '≤ $4.900 COP',
    color: "text-green-600 dark:text-green-400",
  },
  {
    title: 'Donador Medio',
    icon: Star,
    benefit: 'Tiempo de préstamo total: 55 minutos (20 base + 35 extra).',
    threshold: '> $4.900 y < $14.900 COP', // Adjusted threshold description
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    title: 'Donador Alto',
    icon: Star,
    benefit: 'Tiempo de préstamo total: 80 minutos (20 base + 60 extra).',
    threshold: '≥ $14.900 COP', // Adjusted threshold description
    color: "text-purple-600 dark:text-purple-400",
  },
];

const contactEmail = "panaguas.25@gmail.com";
const accountNumber = "944 - 825985 - 49";
const accountNumberToCopy = "94482598549"; // Number without spaces/hyphens

export default function DonatePage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumberToCopy);
      setCopied(true);
      toast({
        title: "Copiado",
        description: "Número de cuenta copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Error",
        description: "No se pudo copiar el número de cuenta.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Apoya a PanAguas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu contribución nos ayuda a mantener y expandir el sistema. ¡Descubre los beneficios de ser donador!
          </p>
        </div>

        {/* Section for Tier Benefits */}
        <Card className="mb-12 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-secondary">
              <Clock className="mr-3 h-6 w-6" />
              Beneficios por Nivel de Donación
            </CardTitle>
            <CardDescription>
              Cada nivel de donación te otorga tiempo adicional para tus préstamos de paraguas. El tiempo base es de 20 minutos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {donationTiersInfo.map((tier, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <tier.icon className={`h-5 w-5 mt-1 flex-shrink-0 ${tier.color}`} />
                  <div>
                    <p className={`font-semibold ${tier.color}`}>{tier.title}</p>
                    <p className="text-sm text-muted-foreground">{tier.benefit}</p>
                    {tier.threshold && (
                      <p className="text-xs text-muted-foreground/80">Donación: {tier.threshold}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Section for Manual Donation Instructions */}
        <Card className="bg-muted/50 border-primary/30">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-primary">
              <Gift className="mr-3 h-6 w-6" />
              Realizar una Donación Manual
            </CardTitle>
            <CardDescription>
              Apreciamos enormemente tu interés en apoyar PanAguas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Donaciones en Línea Próximamente</AlertTitle>
              <AlertDescription>
                ¡Estamos emocionados de construir un futuro más conveniente! Pronto habilitaremos un sistema de donaciones directas en línea. ¡Gracias por tu paciencia y apoyo!
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Instrucciones para Donar Ahora:</h3>
              <p className="text-muted-foreground mb-4">
                Mientras tanto, puedes realizar tu generosa donación mediante transferencia bancaria a la siguiente cuenta:
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 bg-background p-4 rounded-md border">
                <p className="font-mono text-lg text-primary flex-grow">
                  {accountNumber}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="transition-all duration-200 flex-shrink-0" // Ensure button doesn't shrink too much
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2">{copied ? "Copiado" : "Copiar"}</span>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Paso Importante: Notificación</h3>
              <p className="text-muted-foreground mb-3">
                Para asegurar que tu donación sea reconocida y los beneficios aplicados, por favor envía el comprobante de pago a nuestro correo electrónico. Asegúrate de incluir:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Tu nombre completo.</li>
                <li>Tu código de estudiante Uniandino.</li>
              </ul>
               <p className="text-muted-foreground mt-3">
                Esto nos permitirá registrar tu donación correctamente y asignarte los beneficios correspondientes a tu nivel de apoyo.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-sm">
                 <Mail className="h-4 w-4 text-secondary" />
                 <span className="font-medium text-secondary">Correo de contacto:</span>
                 <a href={`mailto:${contactEmail}`} className="text-primary hover:underline underline-offset-2 break-all"> {/* Allow email to break on small screens */}
                    {contactEmail}
                 </a>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  );
}
