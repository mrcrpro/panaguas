
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font for a clean look
import './globals.css';
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import { Toaster } from "@/components/ui/toaster"; // Import Toaster for notifications


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
    <html lang="es">{/* Set language to Spanish */}
      {/* Removed whitespace here */}
      <body className={`${inter.variable} font-sans antialiased`}> {/* Apply Inter font */}
        <AuthProvider> {/* Wrap with AuthProvider */}
          {children}
          <Toaster /> {/* Add Toaster globally */}
        </AuthProvider>
      </body>
    </html>
  );
}
