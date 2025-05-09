
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ThemeProvider } from '@/components/theme-provider';
import QueryProvider from '@/context/query-provider';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Panaguas Portal',
  description: 'Portal de inicio de sesión y donaciones de Panaguas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Ensure no whitespace or comments that could render as text nodes here before body */}
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <QueryProvider>
              <AuthProvider>
                <Suspense fallback={<div className="h-16 bg-background border-b flex items-center justify-center text-sm text-muted-foreground">Cargando Navegación...</div>}>
                  <Navbar />
                </Suspense>
                <main className="flex-grow container mx-auto px-4 py-8">
                   <Suspense fallback={
                       <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
                           <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    }>
                     {children}
                   </Suspense>
                </main>
                <Suspense fallback={<div className="h-16 bg-muted flex items-center justify-center text-sm text-muted-foreground">Cargando Pie de página...</div>}>
                   <Footer />
                </Suspense>
                <Toaster />
              </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
