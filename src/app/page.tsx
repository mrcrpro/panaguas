
"use client";

import { useAuth } from "@/context/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import { WelcomeScreen } from "@/components/dashboard/welcome-screen";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const { user, loading } = useAuth();

  // Optional: Add a loading indicator if preferred over the context's skeleton
  // if (loading) {
  //   return <div className="flex min-h-screen items-center justify-center"><p>Cargando...</p></div>;
  // }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
       <h1 className="text-4xl font-bold mb-8 text-center text-secondary drop-shadow-sm">
            Panaguas Portal
       </h1>
      {user ? <WelcomeScreen /> : <LoginForm />}
      <Toaster />
    </main>
  );
}
