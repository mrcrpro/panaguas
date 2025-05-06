
"use client"; // Needs client-side hooks for auth and data fetching

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, History, Star, UserCircle, LogOut, Loader2 } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { formatDistanceToNowStrict, addMilliseconds, isPast } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale

// Define types
interface UserProfile {
  name: string;
  email: string;
  uniandesCode: string; // Added uniandesCode
  donationTier?: string;
  hasActiveLoan?: boolean;
}

interface LoanDoc {
  userId: string;
  stationId: string;
  loanTime: Timestamp; // Expect Timestamp after retrieval
  returnTime?: Timestamp;
  returnedAtStationId?: string;
  isReturned: boolean;
  fineApplied?: boolean;
  // Derived properties (optional, for convenience)
  loanDurationMinutes?: number;
}

interface ActiveLoanInfo extends LoanDoc {
    id: string; // Add loan ID
    remainingTimeStr: string;
    isOverdue: boolean;
    dueDate: Date;
}


export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeLoan, setActiveLoan] = useState<ActiveLoanInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loanLoading, setLoanLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);


   // --- Utility Functions ---
    const getAllowedDurationMs = useCallback((donationTier?: string): number => {
        const baseDurationMinutes = 20;
        let bonusMinutes = 0;
        switch (donationTier?.toLowerCase()) {
        case 'donador bajo': bonusMinutes = 15; break;
        case 'donador medio': bonusMinutes = 35; break;
        case 'donador alto': bonusMinutes = 60; break;
        default: bonusMinutes = 0; break;
        }
        return (baseDurationMinutes + bonusMinutes) * 60 * 1000;
    }, []);


  // Function to calculate remaining time and update state periodically
    const calculateRemainingTime = useCallback((loanData: LoanDoc, donationTier?: string): ActiveLoanInfo | null => {
        if (!loanData || !loanData.loanTime) return null;

        const loanStartDate = loanData.loanTime.toDate();
        const allowedDurationMs = getAllowedDurationMs(donationTier);
        const dueDate = addMilliseconds(loanStartDate, allowedDurationMs);
        const now = new Date();

        if (isPast(dueDate)) {
            return {
                 ...loanData,
                id: 'unknown', // Will be set correctly in fetchLoan
                remainingTimeStr: "Tiempo Excedido",
                isOverdue: true,
                 dueDate: dueDate,
            };
        } else {
            // Calculate remaining time string using date-fns
            const remainingTimeStr = formatDistanceToNowStrict(dueDate, { locale: es, addSuffix: true });

            return {
                 ...loanData,
                 id: 'unknown', // Will be set correctly in fetchLoan
                 remainingTimeStr: `Restante: ${remainingTimeStr}`,
                 isOverdue: false,
                 dueDate: dueDate,
             };
         }
    }, [getAllowedDurationMs]);


  // --- Data Fetching ---
   useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
        // Fetch profile and active loan in parallel
        const fetchData = async () => {
            setProfileLoading(true);
            setLoanLoading(true);
             try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                 if (userDocSnap.exists()) {
                    const userData = userDocSnap.data() as UserProfile;
                    setProfile(userData);
                     console.log("User profile fetched:", userData);

                    // Only fetch loan if user has one marked in their profile
                    if (userData.hasActiveLoan) {
                        console.log("User has active loan flag, fetching loan details...");
                        const loansQuery = query(
                            collection(db, "loans"),
                            where("userId", "==", user.uid),
                            where("isReturned", "==", false),
                            // orderBy("loanTime", "desc"), // Get the latest loan first
                            limit(1)
                        );
                        const loanSnapshot = await getDocs(loansQuery);

                        if (!loanSnapshot.empty) {
                            const loanDoc = loanSnapshot.docs[0];
                            const loanData = loanDoc.data() as LoanDoc;
                            console.log("Active loan data fetched:", loanData);

                            // Calculate initial remaining time
                             const loanInfo = calculateRemainingTime(loanData, userData.donationTier);
                             if (loanInfo) {
                                setActiveLoan({ ...loanInfo, id: loanDoc.id }); // Set the correct loan ID
                                console.log("Initial active loan info set:", { ...loanInfo, id: loanDoc.id });
                             }

                        } else {
                            console.log("User has active loan flag, but no active loan found in loans collection.");
                             // Optional: Update user profile to hasActiveLoan: false if inconsistent
                        }
                    } else {
                         console.log("User profile indicates no active loan.");
                         setActiveLoan(null); // Ensure no stale loan data is shown
                    }
                } else {
                    console.warn("User document not found in Firestore for UID:", user.uid);
                    // Handle case where user exists in Auth but not Firestore
                     setProfile({ name: user.displayName || user.email || 'Usuario', email: user.email || '', uniandesCode: '', donationTier: 'Gratuito' });
                }
            } catch (error) {
                console.error("Error fetching user profile or loan:", error);
                toast({ title: "Error", description: "No se pudo cargar tu información.", variant: "destructive" });
                // Set default profile or handle differently
                 setProfile({ name: user.displayName || user.email || 'Usuario', email: user.email || '', uniandesCode: '', donationTier: 'Gratuito' });
             } finally {
                setProfileLoading(false);
                setLoanLoading(false);
                console.log("Profile and Loan fetching finished.");
            }
        };
         fetchData();
    }
  }, [user, authLoading, router, toast, calculateRemainingTime]);


   // --- Update Loan Countdown Timer ---
   useEffect(() => {
        if (!activeLoan || activeLoan.isOverdue) return; // No need to update if no loan or already overdue

        const intervalId = setInterval(() => {
            const updatedLoanInfo = calculateRemainingTime(activeLoan, profile?.donationTier);
             if (updatedLoanInfo) {
                setActiveLoan(updatedLoanInfo);
             } else {
                 // Loan might have been returned or state became inconsistent
                 setActiveLoan(null);
             }
        }, 60000); // Update every minute

        return () => clearInterval(intervalId); // Cleanup interval on component unmount or loan change
    }, [activeLoan, profile?.donationTier, calculateRemainingTime]);


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

  const isLoading = authLoading || profileLoading; // Loan loading handled separately inside card

  if (isLoading) {
    // Show skeletons while loading profile
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
           <Skeleton className="h-10 w-1/3 mb-6" />
           <Card>
             <CardHeader>
               <Skeleton className="h-8 w-1/4 mb-2" />
               <Skeleton className="h-4 w-1/2" />
             </CardHeader>
             <CardContent className="space-y-6 pt-6">
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
      case 'donador bajo': return 'text-green-600 dark:text-green-400'; // Matched Donate page
      case 'donador medio': return 'text-blue-600 dark:text-blue-400'; // Matched Donate page
      case 'donador alto': return 'text-purple-600 dark:text-purple-400'; // Matched Donate page
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
                    <CardDescription>{profile.email} - Código: {profile.uniandesCode}</CardDescription>
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
                         {loanLoading ? (
                             <div className="flex items-center space-x-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Cargando estado...</span>
                            </div>
                         ) : activeLoan ? (
                             <div>
                                <p className={`font-medium ${activeLoan.isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                                    {activeLoan.remainingTimeStr}
                                </p>
                                {!activeLoan.isOverdue && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Devolver antes de: {activeLoan.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({activeLoan.dueDate.toLocaleDateString()})
                                    </p>
                                 )}
                                 {activeLoan.isOverdue && (
                                     <p className="text-xs text-destructive mt-1">
                                         ¡Devuelve el paraguas para evitar multas mayores!
                                     </p>
                                 )}
                             </div>
                         ) : (
                            <p className="text-muted-foreground">No tienes préstamos activos.</p>
                         )}
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