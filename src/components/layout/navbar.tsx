
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
    fill="currentColor"
    className={className || "h-6 w-6"}
  >
    <path d="M12 2C7.95 2 4.51 5.07 4.51 9.13C4.51 14.44 12 22 12 22S19.49 14.44 19.49 9.13C19.49 5.07 16.05 2 12 2ZM12 14.5C10.07 14.5 8.5 12.93 8.5 11C8.5 9.07 10.07 7.5 12 7.5C13.93 7.5 15.5 9.07 15.5 11C15.5 12.93 13.93 14.5 12 14.5ZM12 5.5C10.03 5.5 8.41 6.94 8.08 8.75H7C7 7.1 8.34 5.75 10 5.62V4H14V5.62C15.66 5.75 17 7.1 17 8.75H15.92C15.59 6.94 13.97 5.5 12 5.5ZM10.5 9.5H13.5V10C13.5 11.93 11.93 13.5 10 13.5H9.5V12H10C11.1 12 12 11.1 12 10V9.5H10.5Z" />
    <path d="M12 9.5C11.17 9.5 10.5 10.17 10.5 11V12H9.5C8.67 12 8 11.33 8 10.5C8 9.67 8.67 9 9.5 9H10C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9H14.5C15.33 9 16 9.67 16 10.5C16 11.33 15.33 12 14.5 12H13.5V11C13.5 10.17 12.83 9.5 12 9.5Z" fillRule="evenodd" clipRule="evenodd"/>
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
          <Link href="/stations" passHref>
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

