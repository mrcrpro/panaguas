
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function ContactSection() {
  const contactEmail = "j.santacruzc@uniandes.edu.co";

  return (
    <Card className="border-secondary shadow-sm">
      <CardContent className="p-6">
        <p className="text-muted-foreground mb-4">
          Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.
        </p>
        <div className="flex items-center space-x-3">
          <Mail className="h-5 w-5 text-secondary" />
          <a
            href={`mailto:${contactEmail}`}
            className="text-secondary font-medium hover:underline underline-offset-4 transition-colors"
          >
            {contactEmail}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
