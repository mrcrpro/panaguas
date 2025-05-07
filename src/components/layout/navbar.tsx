"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle"; // Import ModeToggle
import { LogIn, LogOut, User } from "lucide-react";

// New SVG Logo Component - Reverted to original simpler design
const PanAguasLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100" // Adjusted viewBox for better clarity if the design is complex
    fill="none"
    stroke="currentColor"
    strokeWidth="3" // Adjusted stroke width for visibility
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className || "h-8 w-8"} // Default size increased slightly
  >
    {/* Main Umbrella Canopy - More Rounded */}
    <path d="M15 55 C 15 30, 85 30, 85 55 A 40 40 0 0 1 15 55 Z" />

    {/* Handle - Centered and Straight */}
    <path d="M50 55 V 90" />

    {/* Optional: Small curve at the bottom of the handle */}
    <path d="M40 90 Q 50 95, 60 90" />

    {/* Raindrops - Simple circles, more spread out */}
    <circle cx="30" cy="25" r="3" />
    <circle cx="50" cy="20" r="3" />
    <circle cx="70" cy="25" r="3" />
    <circle cx="40" cy="35" r="2.5" />
    <circle cx="60" cy="35" r="2.5" />
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
           <PanAguasLogo className="h-7 w-7" /> {/* Brand Icon */}
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
