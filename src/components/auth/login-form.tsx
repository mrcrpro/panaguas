
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config"; // Import db
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { sendWelcomeEmail } from "@/services/email-service"; // Import email service

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

const registerSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres."}),
    email: z.string().email({ message: "Correo electrónico inválido." }),
    uniandesCode: z.string().regex(/^\d{8,10}$/, { message: "El código Uniandino debe ser numérico y tener entre 8 y 10 dígitos." }), // Added uniandesCode validation
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;


export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
          name: "",
          email: "",
          uniandesCode: "", // Added default value
          password: "",
      }
  })

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo!",
      });
      // Redirect or state change handled by AuthProvider
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
      setLoading(true);
      setError(null);
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          const user = userCredential.user;

          // Save user data (name, email, uniandesCode) to Firestore
          await setDoc(doc(db, "users", user.uid), {
              name: values.name,
              email: values.email,
              uniandesCode: values.uniandesCode, // Save uniandesCode
              donationTier: 'Gratuito', // Default donation tier
              hasActiveLoan: false, // Default loan status
              fineAmount: 0 // Default fine amount
          });

           // Send welcome email (don't wait for it)
           sendWelcomeEmail({ email: values.email, name: values.name })
             .catch(emailError => {
                 console.error("Failed to send welcome email:", emailError);
                 // Log error but don't fail registration if email fails
             });

          toast({
            title: "Registro Exitoso",
            description: "Tu cuenta ha sido creada. ¡Revisa tu correo!",
          });
        // Redirect or state change handled by AuthProvider
      } catch (err: any) {
          setError(getFirebaseErrorMessage(err));
          console.error("Registration error:", err);
      } finally {
          setLoading(false);
      }
  };

  // Helper function to provide more user-friendly Firebase error messages
  const getFirebaseErrorMessage = (error: any): string => {
    switch (error.code) {
      case "auth/invalid-email":
        return "El formato del correo electrónico no es válido.";
      case "auth/user-disabled":
        return "Este usuario ha sido deshabilitado.";
      case "auth/user-not-found":
        return "No se encontró ningún usuario con este correo electrónico.";
      case "auth/wrong-password":
        return "Contraseña incorrecta.";
      case "auth/email-already-in-use":
        return "Este correo electrónico ya está en uso.";
      case "auth/operation-not-allowed":
        return "El inicio de sesión con correo y contraseña no está habilitado.";
      case "auth/weak-password":
        return "La contraseña es demasiado débil.";
       case "auth/invalid-uniandes-code": // Example custom error
           return "El código Uniandino no es válido.";
      default:
        // Log the original error for debugging purposes
        console.error("Unhandled Firebase Auth Error:", error);
        return "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
    }
  };

  return (
    <Tabs defaultValue="login" className="w-full max-w-md mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="register">Registrarse</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card className="transition-shadow duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tu correo y contraseña para acceder a tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 transition-opacity duration-300">
                 <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Correo Electrónico</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  {...loginForm.register("email")}
                  disabled={loading}
                  className="transition-colors duration-200 focus:border-primary"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                  disabled={loading}
                   className="transition-colors duration-200 focus:border-primary"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full transition-transform duration-200 active:scale-95 bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="register">
        <Card className="transition-shadow duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>Ingresa tus datos para registrarte.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
                <Alert variant="destructive" className="mb-4 transition-opacity duration-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
             <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="register-name">Nombre Completo</Label>
                 <Input
                   id="register-name"
                   placeholder="Tu Nombre"
                   {...registerForm.register("name")}
                   disabled={loading}
                   className="transition-colors duration-200 focus:border-primary"
                 />
                 {registerForm.formState.errors.name && (
                   <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
                 )}
               </div>
               <div className="space-y-2">
                 <Label htmlFor="register-email">Correo Electrónico</Label>
                 <Input
                   id="register-email"
                   type="email"
                   placeholder="tu@email.com"
                   {...registerForm.register("email")}
                   disabled={loading}
                   className="transition-colors duration-200 focus:border-primary"
                 />
                 {registerForm.formState.errors.email && (
                   <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                 )}
               </div>
                <div className="space-y-2">
                 <Label htmlFor="register-uniandesCode">Código Uniandino</Label>
                 <Input
                   id="register-uniandesCode"
                   placeholder="Tu código de estudiante"
                   {...registerForm.register("uniandesCode")}
                   disabled={loading}
                   className="transition-colors duration-200 focus:border-primary"
                 />
                 {registerForm.formState.errors.uniandesCode && (
                   <p className="text-sm text-destructive">{registerForm.formState.errors.uniandesCode.message}</p>
                 )}
               </div>
               <div className="space-y-2">
                 <Label htmlFor="register-password">Contraseña</Label>
                 <Input
                   id="register-password"
                   type="password"
                   placeholder="••••••••"
                   {...registerForm.register("password")}
                   disabled={loading}
                   className="transition-colors duration-200 focus:border-primary"
                 />
                 {registerForm.formState.errors.password && (
                   <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                 )}
               </div>
               <Button type="submit" className="w-full transition-transform duration-200 active:scale-95 bg-primary hover:bg-primary/90" disabled={loading}>
                 {loading ? "Registrando..." : "Registrarse"}
               </Button>
             </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
