import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Phone, Mail, Car, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { publicBookingSchema } from "@shared/schema";
import { format, addDays, isSameDay, setHours, setMinutes, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import type { PublicBooking } from "@/lib/types";

type BookingFormData = PublicBooking;

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function PublicBooking() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { toast } = useToast();

  // Récupérer les paramètres du centre depuis l'URL ou les paramètres par défaut
  const centerSlug = window.location.pathname.split('/').pop() || 'demo';

  const { data: centerInfo, isLoading: centerLoading } = useQuery({
    queryKey: [`/api/public/center/${centerSlug}`],
    retry: false,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(publicBookingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      preferredDate: "",
      vehicleBrand: "",
      vehicleModel: "",
      licensePlate: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      return apiRequest("POST", `/api/public/booking/${centerSlug}`, {
        ...data,
        preferredDate: selectedDate && selectedTime 
          ? `${format(selectedDate, 'yyyy-MM-dd')} ${selectedTime}`
          : data.preferredDate
      });
    },
    onSuccess: () => {
      setBookingSuccess(true);
      toast({
        title: "Demande de rendez-vous envoyée",
        description: "Nous vous contacterons rapidement pour confirmer votre rendez-vous.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la demande de rendez-vous.",
        variant: "destructive",
      });
    },
  });

  // Générer les créneaux horaires disponibles
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;
    const slotDuration = 30; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time,
          available: true, // Simplifié pour le MVP
        });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Générer les 30 prochains jours (excluant les dimanches)
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return date.getDay() !== 0 ? date : null; // Exclure les dimanches
  }).filter(Boolean) as Date[];

  const onSubmit = (data: BookingFormData) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date et une heure.",
        variant: "destructive",
      });
      return;
    }
    bookingMutation.mutate(data);
  };

  if (centerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Demande envoyée !
            </h2>
            <p className="text-gray-600 mb-4">
              Votre demande de rendez-vous a été envoyée avec succès. 
              Nous vous contacterons rapidement pour confirmer votre créneau.
            </p>
            <div className="text-sm text-gray-500">
              <p>Date souhaitée : {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
              <p>Heure souhaitée : {selectedTime}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {centerInfo?.centerName || "Centre de Contrôle Technique"}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Prenez rendez-vous en ligne pour votre contrôle technique
            </p>
            {centerInfo?.centerAddress && (
              <div className="flex items-center justify-center mt-2 text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{centerInfo.centerAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Informations de contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      placeholder="Jean"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      placeholder="Dupont"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                    placeholder="06 12 34 56 78"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="jean.dupont@email.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Car className="mr-2 h-5 w-5" />
                    Informations du véhicule
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleBrand">Marque</Label>
                      <Input
                        id="vehicleBrand"
                        {...form.register("vehicleBrand")}
                        placeholder="Renault"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Modèle</Label>
                      <Input
                        id="vehicleModel"
                        {...form.register("vehicleModel")}
                        placeholder="Clio"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="licensePlate">Plaque d'immatriculation</Label>
                    <Input
                      id="licensePlate"
                      {...form.register("licensePlate")}
                      placeholder="AB-123-CD"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={bookingMutation.isPending || !selectedDate || !selectedTime}
                  className="w-full"
                >
                  {bookingMutation.isPending ? "Envoi en cours..." : "Demander ce rendez-vous"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sélection de créneaux */}
          <div className="space-y-6">
            {/* Sélection de date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Choisir une date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {availableDates.slice(0, 12).map((date) => (
                    <Button
                      key={date.toISOString()}
                      variant={selectedDate && isSameDay(date, selectedDate) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDate(date)}
                      className="text-xs"
                    >
                      <div className="text-center">
                        <div className="font-medium">
                          {format(date, 'EEE', { locale: fr })}
                        </div>
                        <div>
                          {format(date, 'd MMM', { locale: fr })}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sélection d'heure */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Choisir un horaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className="text-xs"
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résumé */}
            {selectedDate && selectedTime && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-medium text-blue-900 mb-2">Rendez-vous sélectionné</h3>
                  <div className="text-sm text-blue-800">
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-2" />
                      {selectedTime}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}