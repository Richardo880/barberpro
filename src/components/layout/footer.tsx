import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo y descripción */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="font-bold">BP</span>
              </div>
              <span className="text-lg font-bold">BarberPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu barbería de confianza. Estilo y profesionalismo en cada corte.
            </p>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Horarios</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Lun - Vie: 9:00 - 20:00</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Sábado: 9:00 - 18:00</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Domingo: Cerrado</span>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Contacto</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+595 21 123 4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@barberpro.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Asunción, Paraguay</span>
              </div>
            </div>
          </div>

          {/* Enlaces */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Enlaces</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/servicios"
                className="block text-muted-foreground hover:text-primary"
              >
                Servicios
              </Link>
              <Link
                href="/barberos"
                className="block text-muted-foreground hover:text-primary"
              >
                Nuestro Equipo
              </Link>
              <Link
                href="/reservar"
                className="block text-muted-foreground hover:text-primary"
              >
                Reservar Turno
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BarberPro. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
