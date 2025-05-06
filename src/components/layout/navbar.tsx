"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle"; // Import ModeToggle
import { LogIn, LogOut, User } from "lucide-react";

// New SVG Logo Component
const PanAguasLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none" // Ensure fill is none for stroked paths
    stroke="currentColor" // Use currentColor for stroke
    className={className || "h-6 w-6"}
  >
    <path d="M6.75 9.25C6.75 8.00964 7.75964 7 9 7H15C16.2404 7 17.25 8.00964 17.25 9.25V10.5C17.25 11.9004 17.0443 13.2354 16.6652 14.4676C15.6511 17.734 12.8082 20.7078 12.1585 21.3218C12.0543 21.4201 11.9457 21.4201 11.8415 21.3218C11.1918 20.7078 8.34887 17.734 7.33481 14.4676C6.95574 13.2354 6.75 11.9004 6.75 10.5V9.25Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 10C9.5 9.17157 10.1716 8.5 11 8.5H13C13.8284 8.5 14.5 9.17157 14.5 10V10.5C14.5 12.1569 13.1569 13.5 11.5 13.5H10.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 4.5L14.5 2.5" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9.5 4.5L9.5 2.5" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 5.5L12 2.5" strokeWidth="1.5" strokeLinecap="round"/>
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