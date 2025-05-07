import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

// New SVG Logo Component
const PanAguasLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100" // Adjusted viewBox for better clarity if the design is complex
    fill="none"
    stroke="currentColor"
    strokeWidth="3" // Adjusted stroke width for visibility
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className || "h-8 w-8"} // Default size increased slightly
  >
    {/* Main Umbrella Canopy - More Rounded */}
    <path d="M15 55 C 15 30, 85 30, 85 55 A 40 40 0 0 1 15 55 Z" />

    {/* Handle - Centered and Straight */}
    <path d="M50 55 V 90" />

    {/* Optional: Small curve at the bottom of the handle */}
    <path d="M40 90 Q 50 95, 60 90" />

    {/* Raindrops - Simple circles, more spread out */}
    <circle cx="30" cy="25" r="3" />
    <circle cx="50" cy="20" r="3" />
    <circle cx="70" cy="25" r="3" />
    <circle cx="40" cy="35" r="2.5" />
    <circle cx="60" cy="35" r="2.5" />
  </svg>
);


export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted text-muted-foreground border-t mt-12 py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        {/* Brand and Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-lg mb-2 hover:opacity-80 transition-opacity">
            <PanAguasLogo className="h-7 w-7" />
            <span>PanAguas</span>
          </Link>
          <p className="text-sm">
            &copy; {currentYear} PanAguas Uniandes. Todos los derechos reservados.
          </p>
           <p className="text-xs mt-1">
            Un proyecto de la Universidad de los Andes.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-2 text-sm items-center md:items-start">
          <Link href="/#how-it-works" className="hover:text-primary transition-colors">¿Cómo Funciona?</Link>
          <Link href="/donate" className="hover:text-primary transition-colors">Donar</Link>
          <Link href="/stations" className="hover:text-primary transition-colors">Estaciones</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Términos y Condiciones</Link>
        </div>

        {/* Contact & Social */}
        <div className="flex flex-col items-center md:items-end space-y-2">
            <p className="text-sm font-medium">Contacto del Equipo:</p>
             <a
                href="mailto:panaguas.25@gmail.com"
                className="flex items-center space-x-2 hover:text-primary transition-colors text-sm"
             >
                <Mail className="h-4 w-4" />
                <span>panaguas.25@gmail.com</span>
             </a>
          <div className="flex space-x-4 mt-2">
             {/* Add relevant social links if the project has them */}
            {/* Example:
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            <a href="https://linkedin.com/your-profile" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              <Linkedin className="h-5 w-5" />
               <span className="sr-only">LinkedIn</span>
            </a>
             */}
          </div>
        </div>
      </div>
    </footer>
  );
}
