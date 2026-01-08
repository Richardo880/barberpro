"use client";

import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Mail, Phone, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: clientsData, isLoading } = useClients({
    search: debouncedSearch || undefined,
    page: 1,
    limit: 50,
  });
  const clients = clientsData?.clients || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Clientes"
        subtitle="Administra la información de tus clientes"
      />

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nombre o email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <User className="mx-auto mb-4 h-12 w-12" />
              <p>
                {searchTerm
                  ? "No se encontraron clientes"
                  : "No hay clientes registrados"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contacto</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Total Turnos
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Último Turno
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {client.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Desde{" "}
                              {format(new Date(client.createdAt), "MMM yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {client._count?.appointments || 0} turnos
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {client.appointments &&
                        client.appointments.length > 0
                          ? format(
                              new Date(client.appointments[0].startTime),
                              "d MMM yyyy",
                              { locale: es }
                            )
                          : "Sin turnos"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/clientes/${client.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {clientsData && clientsData.pagination.total > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {clients.length} de {clientsData.pagination.total} clientes
        </div>
      )}
    </div>
  );
}
