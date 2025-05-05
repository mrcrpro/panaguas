

"use client";

import type { User } from "firebase/auth";
// Removed onAuthStateChanged, will use useAuthState hook instead
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
import { auth } from "@/lib/firebase/config";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { Loader2 } from "lucide-react"; // Use Loader2 for better visual


interface AuthContextType {
  user: User | null | undefined; // Can be undefined during initial load
  loading: boolean;
  error?: Error; // Include potential error from hook
}

const AuthContext = createContext<AuthContextType>({
  user: undefined, // Initial state is undefined
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
   // Use the hook to manage auth state
   const [user, loading, error] = useAuthState(auth);

  // Display a loading state while checking auth status
  // Loading comes directly from the hook now
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
         <div className="flex flex-col items-center space-y-3 text-center p-4">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
             <p className="text-lg font-medium text-muted-foreground">Verificando sesión...</p>
              {/* Optional: Add skeletons if needed, but loader might suffice */}
             {/* <Skeleton className="h-8 w-64 mt-4" />
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-3/4" /> */}
        </div>
      </div>
    );
  }

   // Handle potential authentication errors from the hook
   if (error) {
     console.error("Firebase Auth Error:", error);
      return (
           <div className="flex min-h-screen items-center justify-center bg-background">
             <div className="space-y-4 p-4 text-center text-destructive">
               <p className="font-semibold">Error de Autenticación</p>
               <p className="text-sm">{error.message}</p>
                <p className="text-xs text-muted-foreground">Intenta recargar la página.</p>
             </div>
           </div>
        );
    }


  return (
     // Provide the user, loading, and error state from the hook
     <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
