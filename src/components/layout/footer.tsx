
import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

// New SVG Logo Component
const PanAguasLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || "h-6 w-6"}
  >
    <path d="M12 2C7.95 2 4.51 5.07 4.51 9.13C4.51 14.44 12 22 12 22S19.49 14.44 19.49 9.13C19.49 5.07 16.05 2 12 2ZM12 14.5C10.07 14.5 8.5 12.93 8.5 11C8.5 9.07 10.07 7.5 12 7.5C13.93 7.5 15.5 9.07 15.5 11C15.5 12.93 13.93 14.5 12 14.5ZM12 5.5C10.03 5.5 8.41 6.94 8.08 8.75H7C7 7.1 8.34 5.75 10 5.62V4H14V5.62C15.66 5.75 17 7.1 17 8.75H15.92C15.59 6.94 13.97 5.5 12 5.5ZM10.5 9.5H13.5V10C13.5 11.93 11.93 13.5 10 13.5H9.5V12H10C11.1 12 12 11.1 12 10V9.5H10.5Z" />
    <path d="M12 9.5C11.17 9.5 10.5 10.17 10.5 11V12H9.5C8.67 12 8 11.33 8 10.5C8 9.67 8.67 9 9.5 9H10C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9H14.5C15.33 9 16 9.67 16 10.5C16 11.33 15.33 12 14.5 12H13.5V11C13.5 10.17 12.83 9.5 12 9.5Z" fillRule="evenodd" clipRule="evenodd"/>
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
