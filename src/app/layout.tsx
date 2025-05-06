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
                <Suspense fallback={<div>Cargando Navegación...</div>}> {/* Add Suspense for Navbar */}
                  <Navbar /> {/* Add Navbar */}
                </Suspense>
                <main className="flex-grow container mx-auto px-4 py-8"> {/* Add main content wrapper */}
                  <Suspense fallback={<div>Cargando Contenido...</div>}> {/* Add Suspense for main content */}
                    {children}
                  </Suspense>
                </main>
                <Suspense fallback={<div>Cargando Pie de página...</div>}> {/* Add Suspense for Footer */}
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
