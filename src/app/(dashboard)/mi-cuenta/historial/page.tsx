"use client";

import { useState } from "react";
import { useRecords } from "@/hooks/use-records";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Scissors, User, ImageIcon } from "lucide-react";

export default function HistorialPage() {
  const { data: recordsData, isLoading } = useRecords();
  const records = recordsData?.records || [];
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxInitialIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Historial de Cortes"
        subtitle="Revisa todos tus cortes anteriores"
      />

      {isLoading ? (
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
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Scissors className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No hay cortes registrados</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tus cortes completados aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {records.map((record: any) => (
            <Card key={record.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid gap-6 p-6 lg:grid-cols-3">
                  {/* Información del corte */}
                  <div className="lg:col-span-1">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {record.service.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(record.date), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </div>
                      </div>

                      {record.staff && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Atendido por: {record.staff.name}</span>
                        </div>
                      )}

                      <div className="text-lg font-bold text-primary">
                        ${record.price}
                      </div>

                      {record.tags && record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {record.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {record.notes && (
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-sm font-medium">Notas:</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fotos del resultado */}
                  <div className="lg:col-span-2">
                    {record.photoUrls && record.photoUrls.length > 0 ? (
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          Fotos del resultado
                        </h4>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Sin fotos registradas
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
