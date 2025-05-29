import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Car, CheckCircle } from "lucide-react";
import { useState } from "react";

const bookingSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(10, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  preferredDate: z.string().min(1, "La date est requise"),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  licensePlate: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface PublicBookingFormProps {
  centerSlug: string;
  centerName: string;
  centerAddress?: string;
  centerPhone?: string;
}

export default function PublicBookingForm({ 
  centerSlug, 
  centerName, 
  centerAddress, 
  centerPhone 
}: PublicBookingFormProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
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
      return apiRequest("POST", `/api/public/booking/${centerSlug}`, data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Demande envoyée",
        description: "Votre demande de rendez-vous a été envoyée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer votre demande.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    // Clean up empty strings
    const cleanData = {
      ...data,
      email: data.email || undefined,
      vehicleBrand: data.vehicleBrand || undefined,
      vehicleModel: data.vehicleModel || undefined,
      licensePlate: data.licensePlate || undefined,
    };

    bookingMutation.mutate(cleanData);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
            <p className="text-gray-600 mb-6">
              Votre demande de rendez-vous a été transmise à {centerName}. 
              Nous vous contacterons rapidement pour confirmer votre rendez-vous.
            </p>
            <Button onClick={() => {
              setIsSubmitted(false);
              form.reset();
            }}>
              Faire une nouvelle demande
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-lg p-3">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{centerName}</h1>
          <p className="mt-2 text-gray-600">Prenez rendez-vous pour votre contrôle technique</p>
          
          {centerAddress && (
            <div className="mt-4 text-sm text-gray-500">
              <p>{centerAddress}</p>
              {centerPhone && <p>{centerPhone}</p>}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demande de rendez-vous</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    className={form.formState.errors.firstName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    className={form.formState.errors.lastName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
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
                  className={form.formState.errors.phone ? "border-red-500" : ""}
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="preferredDate">Date souhaitée *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  {...form.register("preferredDate")}
                  className={form.formState.errors.preferredDate ? "border-red-500" : ""}
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.preferredDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.preferredDate.message}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Informations véhicule (optionnel)
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleBrand">Marque</Label>
                    <Input
                      id="vehicleBrand"
                      {...form.register("vehicleBrand")}
                      placeholder="Renault, Peugeot..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleModel">Modèle</Label>
                    <Input
                      id="vehicleModel"
                      {...form.register("vehicleModel")}
                      placeholder="Clio, 308..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="licensePlate">Immatriculation</Label>
                  <Input
                    id="licensePlate"
                    {...form.register("licensePlate")}
                    placeholder="AB-123-CD"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6"
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? "Envoi en cours..." : "Demander un rendez-vous"}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Nous vous contacterons pour confirmer votre rendez-vous</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
