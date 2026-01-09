"use client";

import { useClientById, useUpdateClientProfile } from "@/hooks/use-clients";
import { useAppointments } from "@/hooks/use-appointments";
import { useRecords } from "@/hooks/use-records";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RecordDialog } from "@/components/admin/record-dialog";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { Mail, Phone, Calendar, Award, ArrowLeft, Save, Plus, History, ImageIcon, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AppointmentStatus } from "@prisma/client";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "No asistió",
};

export default function ClienteDetallePage() {
  const params = useParams();
  const { toast } = useToast();
  const clientId = params.id as string;

  const { data: client, isLoading: clientLoading } = useClientById(clientId);
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments({
    clientId,
  });
  const { data: recordsData, isLoading: recordsLoading } = useRecords({ clientId });
  const updateMutation = useUpdateClientProfile();

  const [notes, setNotes] = useState("");
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [tags, setTags] = useState("");
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxInitialIndex(index);
    setLightboxOpen(true);
  };

  const appointments = (appointmentsData?.appointments || []).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const completedAppointments = appointments.filter(
    (a) => a.status === AppointmentStatus.COMPLETED
  );

  // Update local state when client data loads
  useEffect(() => {
    if (client) {
      setNotes(client.clientProfile?.internalNotes || "");
      setTags(client.clientProfile?.tags?.join(", ") || "");
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;

    try {
      await updateMutation.mutateAsync({
        clientId: client.id,
        data: {
          internalNotes: notes || undefined,
          tags: tags
            ? tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined,
        },
      });

      toast({
        title: "Cambios guardados",
        description: "La información del cliente ha sido actualizada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información",
        variant: "destructive",
      });
    }
  };

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/admin/clientes">Volver a Clientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/clientes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <PageHeader title={client.name} subtitle="Detalles del cliente" />
      </div>

      {/* Client Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl">
                  {client.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{client.name}</h2>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-center">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {appointments.length}
                </p>
                <p className="text-sm text-muted-foreground">Turnos</p>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {completedAppointments.length}
                </p>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="appointments">
            Turnos ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="records">
            Historial ({recordsData?.records?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Agregar notas sobre el cliente (solo visible para staff)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Etiquetas (separadas por comas)
                </label>
                <Input
                  placeholder="VIP, frecuente, etc."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          {appointmentsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-4 h-12 w-12" />
                <p>Este cliente no tiene turnos registrados</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-semibold">
                          {format(new Date(appointment.startTime), "EEEE, d 'de' MMMM 'de' yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(appointment.startTime), "HH:mm")} hs
                      </div>
                      <div className="font-medium">
                        {appointment.service.name}
                      </div>
                      {appointment.staff && (
                        <div className="text-sm text-muted-foreground">
                          Barbero: {appointment.staff.name}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        statusColors[
                          appointment.status as keyof typeof statusColors
                        ]
                      }
                    >
                      {statusLabels[appointment.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Historial de Cortes */}
        <TabsContent value="records" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRecordDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Corte
            </Button>
          </div>

          {recordsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 w-1/3 rounded bg-muted" />
                      <div className="h-4 w-1/2 rounded bg-muted" />
                      <div className="h-20 w-full rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recordsData?.records?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <History className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No hay cortes registrados para este cliente
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setRecordDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primer Corte
                </Button>
              </CardContent>
            </Card>
          ) : (
            recordsData?.records?.map((record: any) => (
              <Card key={record.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Información del corte */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {record.service.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(record.date), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRecord(record);
                            setRecordDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            ${record.price}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {record.tags && record.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {record.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Notas */}
                    {record.notes && (
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Notas:</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {record.notes}
                        </p>
                      </div>
                    )}

                    {/* Fotos */}
                    {record.photoUrls && record.photoUrls.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          Fotos ({record.photoUrls.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {record.photoUrls.map((url: string, idx: number) => (
                            <div
                              key={idx}
                              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted"
                              onClick={() => openLightbox(record.photoUrls, idx)}
                            >
                              <img
                                src={url}
                                alt={`Foto ${idx + 1}`}
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Record Dialog */}
      {client && (
        <RecordDialog
          open={recordDialogOpen}
          onOpenChange={(open) => {
            setRecordDialogOpen(open);
            if (!open) {
              setEditingRecord(null);
            }
          }}
          clientId={clientId}
          clientName={client.name}
          record={editingRecord}
        />
      )}

      {/* Lightbox para ver fotos en pantalla completa */}
      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxInitialIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
