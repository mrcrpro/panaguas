
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl"> {/* Constrain width for readability */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Términos y Condiciones de Uso</h1>
          <p className="text-lg text-muted-foreground">
            Por favor, lee atentamente los términos de uso del sistema PanAguas.
          </p>
        </div>

        <Card className="shadow-md">
           <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center text-foreground/90">
                    <FileText className="mr-2 h-5 w-5" />
                    Acuerdo de Usuario - PanAguas Uniandes
                 </CardTitle>
                 <CardDescription>Última actualización: [Fecha de Actualización]</CardDescription>
           </CardHeader>
          <CardContent className="pt-6 prose dark:prose-invert max-w-none"> {/* Use prose for nice text formatting */}
            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al registrarte y utilizar el servicio de préstamo de paraguas PanAguas ("el Servicio"), operado por [Nombre del Grupo/Iniciativa] en la Universidad de los Andes ("Uniandes"), aceptas cumplir y estar sujeto a los siguientes términos y condiciones ("Términos"). Si no estás de acuerdo con estos Términos, no podrás utilizar el Servicio.
            </p>

            <h2>2. Descripción del Servicio</h2>
            <p>
              PanAguas proporciona un sistema automatizado para el préstamo gratuito y temporal de paraguas a miembros de la comunidad Uniandes (estudiantes, profesores, personal administrativo) que posean un carné universitario válido. El objetivo es ofrecer una solución conveniente para la lluvia inesperada dentro del campus.
            </p>

            <h2>3. Elegibilidad y Registro</h2>
            <p>
              Para utilizar el Servicio, debes ser miembro activo de la comunidad Uniandes y poseer un carné universitario válido y activo. El registro se realiza a través de [Método de registro, ej: esta página web, la máquina] y requiere la aceptación explícita de estos Términos. Estás de acuerdo en proporcionar información veraz y mantenerla actualizada.
            </p>

            <h2>4. Uso del Servicio</h2>
            <ul>
              <li>Los paraguas se prestan utilizando tu carné Uniandes en las máquinas dispensadoras habilitadas.</li>
              <li>Cada usuario puede tener un (1) paraguas en préstamo a la vez.</li>
              <li>El tiempo de préstamo estándar es de [Tiempo estándar, ej: 4 horas]. Este tiempo puede variar según tu nivel de donador (ver sección 6).</li>
              <li>Eres responsable del paraguas mientras esté en tu posesión.</li>
            </ul>

            <h2>5. Devolución y Multas</h2>
            <ul>
              <li>Debes devolver el paraguas en cualquier máquina dispensadora habilitada dentro del plazo establecido.</li>
              <li>La devolución tardía generará multas según la siguiente estructura: [Detallar estructura de multas, ej: X COP por hora de retraso, bloqueo temporal de la cuenta].</li>
              <li>La no devolución o la devolución de un paraguas dañado (más allá del desgaste normal) resultará en una multa equivalente al costo de reposición del paraguas ([Costo de reposición] COP) y posible suspensión del servicio.</li>
              <li>Las multas acumuladas pueden afectar tu estado en la universidad o impedir el uso futuro del servicio.</li>
            </ul>

            <h2>6. Planes de Donación (Opcional)</h2>
            <p>
              PanAguas se financia en parte a través de donaciones voluntarias. Los usuarios que realicen donaciones pueden acceder a beneficios como tiempos de préstamo extendidos, según los niveles establecidos y comunicados en la sección de "Donaciones" de esta página web. Las donaciones no son reembolsables.
            </p>

            <h2>7. Responsabilidad</h2>
            <ul>
              <li>Utilizas el Servicio bajo tu propio riesgo. PanAguas y Uniandes no se hacen responsables por daños personales o materiales derivados del uso (o mal uso) de los paraguas.</li>
              <li>No nos hacemos responsables por la no disponibilidad de paraguas o máquinas en momentos específicos.</li>
            </ul>

             <h2>8. Propiedad Intelectual</h2>
             <p>
                El nombre PanAguas, los logos, diseños y el software asociado son propiedad de [Nombre del Grupo/Iniciativa] y/o Uniandes. No puedes utilizarlos sin autorización expresa.
             </p>

            <h2>9. Modificación de los Términos</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones serán efectivas al ser publicadas en esta página web. Es tu responsabilidad revisar periódicamente los Términos. El uso continuado del Servicio después de cualquier modificación constituye tu aceptación de los nuevos Términos.
            </p>

            <h2>10. Terminación del Servicio</h2>
            <p>
              Nos reservamos el derecho de suspender o terminar tu acceso al Servicio por violación de estos Términos, fraude, o cualquier actividad que consideremos perjudicial para el Servicio o la comunidad.
            </p>

            <h2>11. Privacidad</h2>
            <p>
              La información recopilada durante el registro y uso del servicio se manejará de acuerdo con la Política de Tratamiento de Datos Personales de la Universidad de los Andes. Principalmente, se usará para la gestión del préstamo, cobro de multas y comunicación relacionada con el servicio.
            </p>

             <h2>12. Contacto</h2>
             <p>
                Si tienes preguntas sobre estos Términos, puedes contactarnos a través de [Correo electrónico de contacto: j.santacruzc@uniandes.edu.co].
            </p>

            <p className="font-semibold mt-6">Al marcar la casilla de aceptación durante el registro, confirmas que has leído, entendido y aceptado estos Términos y Condiciones.</p>

          </CardContent>
        </Card>
      </div>
    </section>
  );
}
