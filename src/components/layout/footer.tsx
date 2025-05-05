
import Link from "next/link";
import { Droplets, Github, Linkedin, Mail } from "lucide-react"; // Using lucide icons

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted text-muted-foreground border-t mt-12 py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        {/* Brand and Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-lg mb-2 hover:opacity-80 transition-opacity">
            <Droplets className="h-5 w-5" />
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
          <Link href="/stations" className="hover:text-primary transition-colors">Estaciones</Link> {/* Changed href and text */}
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
