import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

// Updated SVG Logo Component - Based on the provided image
const PanAguasLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24" // Adjusted viewBox for better scaling
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5" // Adjusted stroke width
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className || "h-8 w-8"} // Default size
  >
    {/* Outer Drop Shape */}
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" strokeWidth="1.5"/>
    {/* Umbrella Top */}
    <path d="M14.5 10.5 A 4.5 4.5 0 0 0 9.5 10.5 Z" fill="currentColor"/>
    {/* Umbrella Handle */}
     <line x1="12" y1="10.5" x2="12" y2="17" strokeWidth="1.5" />
     {/* Umbrella Handle Hook */}
     <path d="M12 17 a 1 1 0 0 0 -1 1" strokeWidth="1.5" />
  </svg>
);


export function Footer() {
  const currentYear = new Date().getFullYear();
  const contactEmail = "panaguas.25@gmail.com"; // Updated email

  return (
    <footer className="bg-muted text-muted-foreground border-t mt-12 py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        {/* Brand and Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-lg mb-2 hover:opacity-80 transition-opacity">
            <PanAguasLogo className="h-7 w-7 text-primary" /> {/* Use updated logo */}
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
                href={`mailto:${contactEmail}`}
                className="flex items-center space-x-2 hover:text-primary transition-colors text-sm"
             >
                <Mail className="h-4 w-4" />
                <span>{contactEmail}</span>
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
