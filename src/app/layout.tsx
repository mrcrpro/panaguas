
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from '@/components/layout/navbar'; // Import Navbar
import { Footer } from '@/components/layout/footer'; // Import Footer
import { ThemeProvider } from '@/components/theme-provider'; // Import ThemeProvider
import QueryProvider from '@/context/query-provider'; // Import QueryProvider
import { Suspense } from 'react'; // Import Suspense for loading states
import { Loader2 } from 'lucide-react'; // Import Loader2 icon


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Panaguas Portal', // Updated title
  description: 'Portal de inicio de sesión y donaciones de Panaguas.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning> {/* Add suppressHydrationWarning */}
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <QueryProvider> {/* Wrap with QueryProvider */}
              <AuthProvider>
                <Suspense fallback={<div className="h-16 bg-background border-b flex items-center justify-center text-sm text-muted-foreground">Cargando Navegación...</div>}> {/* Lightweight Suspense fallback */}
                  <Navbar /> {/* Add Navbar */}
                </Suspense>
                <main className="flex-grow container mx-auto px-4 py-8"> {/* Add main content wrapper */}
                   {/* Add Suspense with a more central loading indicator for main content */}
                   <Suspense fallback={
                       <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
                           <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    }>
                     {children}
                   </Suspense>
                </main>
                <Suspense fallback={<div className="h-16 bg-muted flex items-center justify-center text-sm text-muted-foreground">Cargando Pie de página...</div>}> {/* Lightweight Suspense fallback */}
                   <Footer /> {/* Add Footer */}
                </Suspense>
                <Toaster />
              </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
