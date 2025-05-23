import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";
import { PanAguasLogo } from "@/components/PanAguasLogo"; // Import the updated logo component

export function Footer() {
  const currentYear = new Date().getFullYear();
  const contactEmail = "panaguas.25@gmail.com"; // Updated email

  return (
    <footer className="bg-muted text-muted-foreground border-t mt-12 py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        {/* Brand and Copyright */}
        <div className="flex flex-col items-center md:items-start">
          {/* Use the logo component with text */}
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg mb-2 hover:opacity-80 transition-opacity">
            <PanAguasLogo width={30} height={30} /> {/* Removed explicit className size */}
             <span className="text-primary">PanAguas</span> {/* Use primary color */}
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
