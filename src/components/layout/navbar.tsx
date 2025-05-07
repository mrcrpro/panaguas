"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle"; // Import ModeToggle
import { LogIn, LogOut, User } from "lucide-react";

// Updated SVG Logo Component - Based on the provided image
const PanAguasLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24" // Adjusted viewBox for better scaling
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5" // Adjusted stroke width
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className || "h-8 w-8"} // Default size
  >
    {/* Outer Drop Shape */}
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" strokeWidth="1.5" />
    {/* Umbrella Top */}
    <path d="M14.5 10.5 A 4.5 4.5 0 0 0 9.5 10.5 Z" fill="currentColor"/>
    {/* Umbrella Handle */}
     <line x1="12" y1="10.5" x2="12" y2="17" strokeWidth="1.5" />
     {/* Umbrella Handle Hook */}
     <path d="M12 17 a 1 1 0 0 0 -1 1" strokeWidth="1.5" />
  </svg>
);


export function Navbar() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      // Redirect handled by AuthProvider/router if needed
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error al Cerrar Sesión",
        description: "Ocurrió un problema al cerrar tu sesión.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-xl hover:opacity-80 transition-opacity">
           <PanAguasLogo className="h-7 w-7 text-primary" /> {/* Brand Icon */}
           <span>PanAguas</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/#how-it-works" passHref legacyBehavior>
            <Button variant="ghost" className="text-foreground/80 hover:text-foreground">¿Cómo funciona?</Button>
          </Link>
           <Link href="/donate" passHref legacyBehavior>
             <Button variant="ghost" className="text-foreground/80 hover:text-foreground">Donar</Button>
           </Link>
           <Link href="/stations" passHref >
            <Button variant="ghost" className="text-foreground/80 hover:text-foreground">Estaciones</Button>
          </Link>

          <div className="border-l h-6 mx-2"></div> {/* Separator */}

           <ModeToggle /> {/* Add Theme Toggle */}

          {loading ? (
            <Button variant="ghost" size="icon" disabled>
              <User className="h-5 w-5 animate-pulse" />
            </Button>
          ) : user ? (
            <>
              <Link href="/account" passHref legacyBehavior>
                <Button variant="ghost" size="icon" title="Mi Cuenta">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Mi Cuenta</span>
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="icon" title="Cerrar Sesión">
                <LogOut className="h-5 w-5" />
                 <span className="sr-only">Cerrar Sesión</span>
              </Button>
            </>
          ) : (
             <Link href="/login" passHref legacyBehavior>
                <Button variant="outline" className="rounded-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
