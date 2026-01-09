"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useServices } from "@/hooks/use-services";
import { useStaff } from "@/hooks/use-staff";
import { useAvailableSlots, useCreateAppointment } from "@/hooks/use-appointments";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Check, Clock, Scissors, User, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface WizardState {
  serviceId: string | null;
  staffId: string | null;
  date: Date | null;
  timeSlot: string | null;
  notes: string;
}

export default function NuevaReservaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [state, setState] = useState<WizardState>({
    serviceId: searchParams.get("service"),
    staffId: searchParams.get("staff"),
    date: null,
    timeSlot: null,
    notes: "",
  });

  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: staffData, isLoading: staffLoading } = useStaff();
  const createMutation = useCreateAppointment();

  const services = servicesData?.services || [];
  const staff = staffData?.staff || [];
  const selectedService = services.find((s) => s.id === state.serviceId);
  const selectedStaff = staff.find((s) => s.id === state.staffId);

  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots(
    state.serviceId || "",
    state.date ? format(state.date, "yyyy-MM-dd") : "",
    state.staffId || undefined,
    { enabled: !!state.date && !!state.serviceId }
  );

  const availableSlots = slotsData?.slots || [];

  // Auto-advance if pre-selected from query params
  useEffect(() => {
    if (step === 1 && state.serviceId) {
      setStep(2);
    }
  }, []);

  const handleServiceSelect = (serviceId: string) => {
    setState({ ...state, serviceId, date: null, timeSlot: null });
    setStep(2);
  };

  const handleStaffSelect = (staffId: string | null) => {
    setState({ ...state, staffId, date: null, timeSlot: null });
    setStep(3);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setState({ ...state, date, timeSlot: null });
  };

  const handleTimeSlotSelect = (slot: string) => {
    setState({ ...state, timeSlot: slot });
    setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!state.serviceId || !state.date || !state.timeSlot) {
      toast({
        title: "Error",
        description: "Por favor completa todos los pasos",
        variant: "destructive",
      });
      return;
    }

    try {
      const [hours, minutes] = state.timeSlot.split(":").map(Number);
      const appointmentDate = new Date(state.date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      await createMutation.mutateAsync({
        serviceId: state.serviceId,
        staffId: state.staffId || undefined,
        startTime: appointmentDate.toISOString(),
        clientNotes: state.notes || undefined,
      });

      // Mostrar popup de confirmación
      setShowConfirmation(true);
    } catch (error: any) {
      toast({
        title: "Error al reservar",
        description: error.message || "No se pudo crear la reserva",
        variant: "destructive",
      });
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    router.push("/mi-cuenta/reservas");
  };

  const progress = (step / 4) * 100;
  const today = startOfDay(new Date());

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Nueva Reserva"
        subtitle="Completa los pasos para reservar tu turno"
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Paso {step} de 4
          </span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Selecciona un servicio</h2>
          {servicesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${state.serviceId === service.id ? "ring-2 ring-primary" : ""
                    }`}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  {/* Imagen del servicio */}
                  <div className="relative h-40 w-full bg-muted">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Scissors className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {state.serviceId === service.id && (
                      <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Título */}
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{service.name}</h3>
                    </div>

                    {/* Descripción */}
                    {service.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {/* Duración y Precio */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.duration} min
                      </span>
                      <span className="font-semibold text-primary">
                        ₲ {service.price.toLocaleString("es-PY")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
      }

      {/* Step 2: Select Staff */}
      {
        step === 2 && selectedService && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Elige tu barbero</h2>
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Scissors className="h-4 w-4 text-primary" />
                  <span>Servicio seleccionado:</span>
                  <span className="font-semibold">{selectedService.name}</span>
                </div>
              </CardContent>
            </Card>

            {staffLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Sin preferencia option */}
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${state.staffId === null ? "ring-2 ring-primary" : ""
                    }`}
                  onClick={() => handleStaffSelect(null)}
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <Avatar className="h-20 w-20 border-2">
                      <AvatarFallback className="bg-muted text-2xl">
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 font-semibold">Sin preferencia</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cualquier barbero disponible
                    </p>
                    {state.staffId === null && (
                      <Check className="mt-2 h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>

                {staff
                  .filter((s) =>
                    s.services?.some((service) => service.id === state.serviceId)
                  )
                  .map((member) => (
                    <Card
                      key={member.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${state.staffId === member.id ? "ring-2 ring-primary" : ""
                        }`}
                      onClick={() => handleStaffSelect(member.id)}
                    >
                      <CardContent className="flex flex-col items-center p-6 text-center">
                        <Avatar className="h-20 w-20 border-2">
                          <AvatarImage src={member.photoUrl || undefined} />
                          <AvatarFallback className="text-2xl">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="mt-4 font-semibold">{member.name}</h3>
                        {member.bio && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {member.bio}
                          </p>
                        )}
                        {state.staffId === member.id && (
                          <Check className="mt-2 h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )
      }

      {/* Step 3: Select Date & Time */}
      {
        step === 3 && selectedService && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Elige fecha y hora</h2>
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Scissors className="h-4 w-4 text-primary" />
                  <span>{selectedService.name}</span>
                </div>
                {selectedStaff && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" />
                    <span>Barbero: {selectedStaff.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Calendar */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold">Selecciona un día</h3>
                  <Calendar
                    mode="single"
                    selected={state.date || undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < today}
                    locale={es}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold">
                    {state.date
                      ? `Horarios - ${format(state.date, "d 'de' MMMM", { locale: es })}`
                      : "Horarios disponibles"}
                  </h3>
                  {!state.date ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <p className="text-sm">Selecciona primero una fecha</p>
                    </div>
                  ) : slotsLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                      ))}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <p className="text-sm">No hay horarios disponibles</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={state.timeSlot === slot.time ? "default" : "outline"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                          className="w-full"
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

      {/* Step 4: Confirmation */}
      {
        step === 4 && selectedService && state.date && state.timeSlot && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Confirma tu reserva</h2>
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">
                        {format(state.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {state.timeSlot} hs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Scissors className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{selectedService.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.duration} min - ₲{" "}
                        {selectedService.price.toLocaleString("es-PY")}
                      </p>
                    </div>
                  </div>

                  {selectedStaff ? (
                    <div className="flex items-start gap-3">
                      <User className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{selectedStaff.name}</p>
                        <p className="text-sm text-muted-foreground">Barbero</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <User className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Sin preferencia</p>
                        <p className="text-sm text-muted-foreground">
                          Cualquier barbero disponible
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Notas adicionales (opcional)
                  </label>
                  <Textarea
                    placeholder="Ej: Quiero un degradado bajo..."
                    value={state.notes}
                    onChange={(e) => setState({ ...state, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Reservando..." : "Confirmar Reserva"}
                {!createMutation.isPending && <Check className="ml-2 h-5 w-5" />}
              </Button>
            </div>
          </div>
        )
      }

      {/* Popup de confirmación */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              ¡Reserva Confirmada!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base">
                Tu turno ha sido reservado exitosamente.
              </p>

              {state.date && state.timeSlot && selectedService && (
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-semibold">
                      {format(state.date, "EEEE, d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hora:</span>
                    <span className="font-semibold">{state.timeSlot} hs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Servicio:</span>
                    <span className="font-semibold">{selectedService.name}</span>
                  </div>
                  {selectedStaff && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Barbero:</span>
                      <span className="font-semibold">{selectedStaff.name}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Recibirás un recordatorio antes de tu cita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={handleConfirmationClose} className="w-full">
              Ver Mis Reservas
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
