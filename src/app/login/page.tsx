
"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/auth-context";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect logged-in users away from the login page
        if (!loading && user) {
            router.push('/account'); // Redirect to account page or dashboard
        }
    }, [user, loading, router]);


    // Optional: Show loading state while checking auth
    if (loading) {
        return <div className="flex min-h-screen items-center justify-center"><p>Cargando...</p></div>;
    }

    // Only render login form if user is not logged in
    if (!user) {
        return (
            <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-4"> {/* Adjust min-height */}
            <h1 className="text-3xl font-semibold mb-6 text-center text-secondary">
                Accede a tu Cuenta
            </h1>
            <LoginForm />
            <Toaster />
            </main>
        );
    }

    // If user is logged in but redirection hasn't happened yet (unlikely but safe fallback)
    return null;
}
