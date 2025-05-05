
"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Heart, Mail } from "lucide-react";
import { DonationForm } from '@/components/donations/donation-form'; // Import DonationForm
import { ContactSection } from '@/components/contact/contact-section'; // Import ContactSection

export function WelcomeScreen() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error al Cerrar Sesión",
        description: "Ocurrió un problema al cerrar tu sesión.",
        variant: "destructive",
      });
    }
  };

  // Fetch user name from Firestore or display email as fallback
  const displayName = user?.displayName || user?.email || 'Usuario';


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center min-h-screen justify-center">
        <Card className="w-full max-w-4xl shadow-lg rounded-lg overflow-hidden mb-8 bg-card">
            <CardHeader className="bg-secondary text-secondary-foreground p-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-3xl font-bold">Bienvenido a Panaguas, {displayName}!</CardTitle>
                    <CardDescription className="text-secondary-foreground/80 mt-1">Gracias por ser parte de nuestra comunidad.</CardDescription>
                 </div>
                 <Button onClick={handleLogout} variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary/80">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Cerrar Sesión</span>
                 </Button>
            </CardHeader>
             <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Donation Section */}
                 <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center text-primary">
                        <Heart className="mr-2 h-6 w-6" />
                        Realizar una Donación
                    </h2>
                    <p className="text-muted-foreground">
                        Tu apoyo nos ayuda a continuar nuestra misión. Cada contribución hace la diferencia.
                    </p>
                    <DonationForm />
                 </div>

                 {/* Contact Section */}
                 <div className="space-y-4">
                     <h2 className="text-2xl font-semibold flex items-center text-primary">
                        <Mail className="mr-2 h-6 w-6" />
                        Contáctanos
                     </h2>
                     <ContactSection />
                 </div>
            </CardContent>
             <CardFooter className="bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                Panaguas Portal &copy; {new Date().getFullYear()}
            </CardFooter>
        </Card>
    </div>
  );
}
