
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from '@/components/layout/navbar'; // Import Navbar
import { Footer } from '@/components/layout/footer'; // Import Footer
import { ThemeProvider } from '@/components/theme-provider'; // Import ThemeProvider


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PanAguas - Universidad de los Andes', // Updated title
  description: 'Sistema de préstamo gratuito de paraguas automatizado en la Universidad de los Andes.', // Updated description
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
          <AuthProvider>
            <Navbar /> {/* Add Navbar */}
            <main className="flex-grow container mx-auto px-4 py-8"> {/* Add main content wrapper */}
              {children}
            </main>
            <Footer /> {/* Add Footer */}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
