import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, Save, Check, X, Clock, Globe } from "lucide-react";

export default function Booking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [centerInfo, setCenterInfo] = useState({
    name: "Centre Auto Plus",
    address: "123 Rue de la République\n75001 Paris",
    phone: "01 23 45 67 89",
    slug: "centre-auto-plus",
    mondayFridayStart: "08:00",
    mondayFridayEnd: "18:00",
    saturdayStart: "08:00",
    saturdayEnd: "12:00",
    appointmentDuration: 30,
    minBookingNotice: 24,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/center-settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/center-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "La configuration a été mise à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/center-settings"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const workingHours = {
      monday: { start: centerInfo.mondayFridayStart, end: centerInfo.mondayFridayEnd },
      tuesday: { start: centerInfo.mondayFridayStart, end: centerInfo.mondayFridayEnd },
      wednesday: { start: centerInfo.mondayFridayStart, end: centerInfo.mondayFridayEnd },
      thursday: { start: centerInfo.mondayFridayStart, end: centerInfo.mondayFridayEnd },
      friday: { start: centerInfo.mondayFridayStart, end: centerInfo.mondayFridayEnd },
      saturday: { start: centerInfo.saturdayStart, end: centerInfo.saturdayEnd },
      sunday: { start: null, end: null },
    };

    updateSettingsMutation.mutate({
      appointmentDuration: centerInfo.appointmentDuration,
      minBookingNotice: centerInfo.minBookingNotice,
      workingHours,
    });
  };

  // Mock recent bookings for demonstration
  const recentBookings = [
    {
      id: 1,
      clientName: "Marie Leroy",
      phone: "06 98 76 54 32",
      email: "marie.leroy@email.com",
      preferredDate: "20/01/2024",
      status: "pending",
    },
    {
      id: 2,
      clientName: "Thomas Bernard",
      phone: "06 11 22 33 44",
      email: null,
      preferredDate: "18/01/2024",
      status: "confirmed",
      appointmentTime: "14:30",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Prise de RDV en ligne</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Configurez votre page publique de prise de rendez-vous
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Prévisualiser
                </Button>
                <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration de la page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="centerName">Nom du centre</Label>
                    <Input
                      id="centerName"
                      value={centerInfo.name}
                      onChange={(e) => setCenterInfo({ ...centerInfo, name: e.target.value })}
                      placeholder="Centre Auto Plus"
                    />
                  </div>

                  <div>
                    <Label htmlFor="centerAddress">Adresse</Label>
                    <Textarea
                      id="centerAddress"
                      value={centerInfo.address}
                      onChange={(e) => setCenterInfo({ ...centerInfo, address: e.target.value })}
                      placeholder="123 Rue de la République&#10;75001 Paris"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="centerPhone">Téléphone</Label>
                    <Input
                      id="centerPhone"
                      type="tel"
                      value={centerInfo.phone}
                      onChange={(e) => setCenterInfo({ ...centerInfo, phone: e.target.value })}
                      placeholder="01 23 45 67 89"
                    />
                  </div>

                  <div>
                    <Label htmlFor="workingHours">Horaires d'ouverture</Label>
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-700">Lundi - Vendredi</span>
                        <Input
                          type="time"
                          value={centerInfo.mondayFridayStart}
                          onChange={(e) => setCenterInfo({ ...centerInfo, mondayFridayStart: e.target.value })}
                          className="text-xs"
                        />
                        <Input
                          type="time"
                          value={centerInfo.mondayFridayEnd}
                          onChange={(e) => setCenterInfo({ ...centerInfo, mondayFridayEnd: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-700">Samedi</span>
                        <Input
                          type="time"
                          value={centerInfo.saturdayStart}
                          onChange={(e) => setCenterInfo({ ...centerInfo, saturdayStart: e.target.value })}
                          className="text-xs"
                        />
                        <Input
                          type="time"
                          value={centerInfo.saturdayEnd}
                          onChange={(e) => setCenterInfo({ ...centerInfo, saturdayEnd: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="centerSlug">URL de la page publique</Label>
                    <div className="flex mt-2">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        <Globe className="h-4 w-4 mr-1" />
                        techcontrol.app/
                      </span>
                      <Input
                        id="centerSlug"
                        value={centerInfo.slug}
                        onChange={(e) => setCenterInfo({ ...centerInfo, slug: e.target.value })}
                        placeholder="centre-auto-plus"
                        className="rounded-none rounded-r-md"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Slots */}
              <Card>
                <CardHeader>
                  <CardTitle>Créneaux disponibles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="appointmentDuration">Durée d'un contrôle (minutes)</Label>
                    <Select
                      value={centerInfo.appointmentDuration.toString()}
                      onValueChange={(value) => setCenterInfo({ ...centerInfo, appointmentDuration: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="minBookingNotice">Délai de réservation minimum</Label>
                    <Select
                      value={centerInfo.minBookingNotice.toString()}
                      onValueChange={(value) => setCenterInfo({ ...centerInfo, minBookingNotice: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 heures</SelectItem>
                        <SelectItem value="48">48 heures</SelectItem>
                        <SelectItem value="72">3 jours</SelectItem>
                        <SelectItem value="168">1 semaine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview and Recent Bookings */}
            <div className="space-y-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu de la page publique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">{centerInfo.name}</h2>
                      <p className="text-gray-600 mt-2">Prenez rendez-vous pour votre contrôle technique</p>
                    </div>

                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Prénom</Label>
                          <Input
                            type="text"
                            placeholder="Martin"
                            className="text-sm"
                            disabled
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Nom</Label>
                          <Input
                            type="text"
                            placeholder="Dubois"
                            className="text-sm"
                            disabled
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                        <Input
                          type="tel"
                          placeholder="06 12 34 56 78"
                          className="text-sm"
                          disabled
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email (optionnel)</Label>
                        <Input
                          type="email"
                          placeholder="martin.dubois@email.com"
                          className="text-sm"
                          disabled
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Date souhaitée</Label>
                        <Input
                          type="date"
                          className="text-sm"
                          disabled
                        />
                      </div>

                      <Button className="w-full text-sm font-medium" disabled>
                        Demander un rendez-vous
                      </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-500">
                      <p>Nous vous contacterons pour confirmer votre rendez-vous</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Demandes récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          booking.status === "pending" ? "bg-blue-50" : "bg-green-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.clientName}</p>
                          <p className="text-xs text-gray-500">
                            {booking.phone} {booking.email && `• ${booking.email}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.status === "confirmed"
                              ? `RDV confirmé le ${booking.preferredDate} à ${booking.appointmentTime}`
                              : `Souhaite un RDV le ${booking.preferredDate}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {booking.status === "pending" ? (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              Confirmé
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
