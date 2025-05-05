
"use client"; // Needs client-side hooks for auth and potential data fetching

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, History, Star, UserCircle, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";


// Define a type for user profile data fetched from Firestore
interface UserProfile {
  name: string;
  email: string;
  donationTier?: string; // Example: 'Gratuito', 'Donador Menor', etc.
  // Add other relevant fields like loan time extension, etc.
}


export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);


  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
        // Fetch user profile from Firestore
        const fetchProfile = async () => {
            setProfileLoading(true);
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    // Map Firestore data to UserProfile type
                    const data = userDocSnap.data();
                     setProfile({
                        name: data.name || user.displayName || 'Usuario', // Fallback logic
                        email: data.email || user.email || '',
                        donationTier: data.donationTier || 'Gratuito', // Default to free tier
                     });
                } else {
                    // Handle case where user exists in Auth but not Firestore (optional)
                     setProfile({ name: user.displayName || user.email || 'Usuario', email: user.email || '', donationTier: 'Gratuito' });
                    console.warn("User document not found in Firestore for UID:", user.uid);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                 toast({ title: "Error", description: "No se pudo cargar tu perfil.", variant: "destructive" });
                 // Set a default profile to avoid errors, or handle differently
                 setProfile({ name: user.displayName || user.email || 'Usuario', email: user.email || '', donationTier: 'Gratuito' });
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }
  }, [user, authLoading, router, toast]);


   const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
       router.push('/'); // Redirect to home after logout
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error al Cerrar Sesión",
        description: "Ocurrió un problema al cerrar tu sesión.",
        variant: "destructive",
      });
    } finally {
        setLogoutLoading(false);
    }
  };

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    // Show skeletons while loading
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
           <Skeleton className="h-10 w-1/3 mb-6" />
           <Card>
             <CardHeader>
               <Skeleton className="h-8 w-1/4 mb-2" />
               <Skeleton className="h-4 w-1/2" />
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
               </div>
               <Skeleton className="h-10 w-32" />
             </CardContent>
           </Card>
        </div>
      </section>
    );
  }

  if (!user || !profile) {
    // Should be redirected, but provides a fallback message
    return (
         <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
             <p>Redirigiendo...</p>
         </div>
     );
  }

  // --- Display Account Information ---
   const getDonationTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'donador menor': return 'text-green-600 dark:text-green-400';
      case 'donador medio': return 'text-blue-600 dark:text-blue-400';
      case 'donador alto': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8">Mi Cuenta</h1>

        <Card className="shadow-md border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center space-x-4">
                 <UserCircle className="h-10 w-10 text-primary" />
                 <div>
                    <CardTitle className="text-2xl">{profile.name}</CardTitle>
                    <CardDescription>{profile.email}</CardDescription>
                 </div>
            </div>

          </CardHeader>
          <CardContent className="pt-6 space-y-8">
             {/* Account Details Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Loan Status */}
                <Card className="border-secondary/30">
                    <CardHeader className="pb-3">
                         <CardTitle className="text-lg flex items-center text-secondary">
                            <Clock className="mr-2 h-5 w-5"/> Estado del Préstamo
                         </CardTitle>
                    </CardHeader>
                     <CardContent>
                         {/* Replace with actual loan data */}
                        <p className="text-muted-foreground">No tienes préstamos activos.</p>
                        {/* Example if active:
                        <p>Tiempo restante: <span className="font-medium text-foreground">2h 15min</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Devolver antes de: 17:30 Hoy</p>
                         */}
                    </CardContent>
                </Card>

                 {/* Donation Tier / Plan */}
                <Card className="border-accent/30">
                     <CardHeader className="pb-3">
                         <CardTitle className="text-lg flex items-center text-accent">
                            <Star className="mr-2 h-5 w-5"/> Nivel de Donador
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`font-semibold ${getDonationTierColor(profile.donationTier)}`}>{profile.donationTier || 'Gratuito'}</p>
                        {profile.donationTier !== 'Gratuito' && (
                             <p className="text-xs text-muted-foreground mt-1">¡Gracias por tu apoyo!</p>
                        )}
                         <Link href="/donate" passHref legacyBehavior>
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary">
                                Ver planes / Cambiar nivel
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                 {/* Loan History */}
                <Card className="md:col-span-2 border-muted">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center text-muted-foreground">
                            <History className="mr-2 h-5 w-5"/> Historial de Préstamos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         {/* Replace with actual history data - maybe a small table or list */}
                        <p className="text-sm text-muted-foreground">Aún no tienes historial.</p>
                        {/* Example:
                        <ul className="text-sm space-y-1">
                            <li>10/05/24 - Préstamo Ed. SD (Devuelto)</li>
                            <li>08/05/24 - Préstamo Ed. ML (Devuelto - Multa leve)</li>
                        </ul>
                         */}
                    </CardContent>
                </Card>

            </div>

             {/* Logout Button */}
            <div className="flex justify-end pt-4 border-t">
                 <Button
                    onClick={handleLogout}
                    variant="destructive"
                    disabled={logoutLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutLoading ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
                  </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </section>
  );
}
