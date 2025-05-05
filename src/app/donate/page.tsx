
import { DonationCard } from '@/components/donations/donation-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function DonatePage() {
  const donationTiers = [
    {
      title: 'Plan Gratuito',
      description: 'Acceso básico al sistema.',
      price: '$0',
      features: ['Préstamo estándar'],
      highlight: false,
      cta: 'Regístrate Gratis',
      link: '/login', // Link to login/register page
    },
    {
      title: 'Donador Menor',
      description: 'Apoya la iniciativa y obtén beneficios.',
      priceRange: '≤ $5.000 COP',
      amountThreshold: 5000, // Max amount for this tier
      features: ['Tiempo de préstamo extendido (ej. +30 min)', 'Insignia digital'],
      highlight: false,
      cta: 'Donar',
    },
    {
      title: 'Donador Medio',
      description: 'Mayor impacto y reconocimiento.',
      priceRange: '$5.001 - $14.999 COP',
      amountThreshold: 14999, // Max amount for this tier
      features: ['Tiempo de préstamo extendido (ej. +1 hora)', 'Insignia digital premium', 'Mención en agradecimientos'],
      highlight: true, // Highlight this plan
      cta: 'Donar',
    },
     {
      title: 'Donador Alto',
      description: 'Máximo apoyo, beneficios exclusivos.',
      priceRange: '≥ $15.000 COP',
      amountThreshold: Infinity, // No upper limit for donation amount
      features: ['Tiempo de préstamo extendido (ej. +2 horas)', 'Insignia digital exclusiva', 'Mención destacada', 'Acceso prioritario (si aplica)'],
      highlight: false,
      cta: 'Donar',
    },
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Apoya a PanAguas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu contribución nos permite mantener y expandir nuestro sistema de paraguas compartidos. ¡Elige el nivel de apoyo que más te convenga!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {donationTiers.map((tier, index) => (
            <DonationCard key={index} {...tier} />
          ))}
        </div>

         {/* Optional: Add a section explaining the impact of donations */}
         <Card className="mt-16 bg-secondary/10 border-secondary/30">
            <CardHeader>
                 <CardTitle className="flex items-center text-secondary">
                    <Heart className="mr-2 h-6 w-6"/>
                    ¿Por qué donar?
                 </CardTitle>
                <CardDescription>Tu aporte hace la diferencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-secondary/90">
                <p>• Ayuda a cubrir costos de mantenimiento y reparación de paraguas y máquinas.</p>
                <p>• Permite la expansión del sistema a más puntos del campus.</p>
                <p>• Fomenta una cultura de compartir y sostenibilidad en Uniandes.</p>
                <p>• ¡Mantiene el servicio gratuito para todos!</p>
            </CardContent>
         </Card>
      </div>
    </section>
  );
}
