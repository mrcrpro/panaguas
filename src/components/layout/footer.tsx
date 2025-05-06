import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

// New SVG Logo Component
const PanAguasLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none" // Changed from currentColor
    stroke="currentColor" // Added
    className={className || "h-6 w-6"}
  >
    <path d="M6.75 9.25C6.75 8.00964 7.75964 7 9 7H15C16.2404 7 17.25 8.00964 17.25 9.25V10.5C17.25 11.9004 17.0443 13.2354 16.6652 14.4676C15.6511 17.734 12.8082 20.7078 12.1585 21.3218C12.0543 21.4201 11.9457 21.4201 11.8415 21.3218C11.1918 20.7078 8.34887 17.734 7.33481 14.4676C6.95574 13.2354 6.75 11.9004 6.75 10.5V9.25Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 10C9.5 9.17157 10.1716 8.5 11 8.5H13C13.8284 8.5 14.5 9.17157 14.5 10V10.5C14.5 12.1569 13.1569 13.5 11.5 13.5H10.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 4.5L14.5 2.5" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9.5 4.5L9.5 2.5" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 5.5L12 2.5" strokeWidth="1.5" strokeLinecap="round"/>
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
            <PanAguasLogo className="h-5 w-5" />
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
          <Link href="/donate" className="hover:text-primary transition-colors">Donaciones</Link>
          <Link href="/stations" className="hover:text-primary transition-colors">Estaciones</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Términos y Condiciones</Link>
        </div>

        {/* Contact & Social */}
        <div className="flex flex-col items-center md:items-end space-y-2">
            <p className="text-sm font-medium">Contacto del Equipo:</p>
             <a
                href="mailto:j.santacruzc@uniandes.edu.co"
                className="flex items-center space-x-2 hover:text-primary transition-colors text-sm"
             >
                <Mail className="h-4 w-4" />
                <span>j.santacruzc@uniandes.edu.co</span>
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
