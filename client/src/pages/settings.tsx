import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Building2, Clock, Bell, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const centerSettingsSchema = z.object({
  centerName: z.string().min(1, "Le nom du centre est requis"),
  centerAddress: z.string().optional(),
  centerPhone: z.string().optional(),
  centerSlug: z.string().min(1, "L'identifiant URL est requis").regex(/^[a-z0-9-]+$/, "Utilisez uniquement des lettres minuscules, chiffres et tirets"),
  appointmentDuration: z.number().min(15, "Durée minimum 15 minutes").max(240, "Durée maximum 4 heures"),
  minBookingNotice: z.number().min(1, "Préavis minimum 1 heure").max(168, "Préavis maximum 1 semaine"),
});

const workingHoursSchema = z.object({
  monday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  tuesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  wednesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  thursday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  friday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  saturday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  sunday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
});

type CenterSettingsData = z.infer<typeof centerSettingsSchema>;
type WorkingHoursData = z.infer<typeof workingHoursSchema>;

export default function CenterSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/center-settings"],
  });

  const defaultWorkingHours: WorkingHoursData = {
    monday: { enabled: true, start: "08:00", end: "18:00" },
    tuesday: { enabled: true, start: "08:00", end: "18:00" },
    wednesday: { enabled: true, start: "08:00", end: "18:00" },
    thursday: { enabled: true, start: "08:00", end: "18:00" },
    friday: { enabled: true, start: "08:00", end: "18:00" },
    saturday: { enabled: true, start: "08:00", end: "16:00" },
    sunday: { enabled: false, start: "08:00", end: "16:00" },
  };

  const centerForm = useForm<CenterSettingsData>({
    resolver: zodResolver(centerSettingsSchema),
    defaultValues: {
      centerName: user?.centerName || "",
      centerAddress: user?.centerAddress || "",
      centerPhone: user?.centerPhone || "",
      centerSlug: user?.centerSlug || "",
      appointmentDuration: (settings as any)?.appointmentDuration || 60,
      minBookingNotice: (settings as any)?.minBookingNotice || 24,
    },
  });

  const [workingHours, setWorkingHours] = useState<WorkingHoursData>(
    (settings as any)?.workingHours || defaultWorkingHours
  );

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/center-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres du centre ont été mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/center-settings"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    },
  });

  const onSubmitCenter = (data: CenterSettingsData) => {
    updateSettingsMutation.mutate({
      ...data,
      workingHours,
    });
  };

  const updateWorkingHours = (day: keyof WorkingHoursData, field: keyof WorkingHoursData[keyof WorkingHoursData], value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const days = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Paramètres du centre</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Configurez les informations et paramètres de votre centre
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Informations générales</TabsTrigger>
              <TabsTrigger value="hours">Horaires</TabsTrigger>
              <TabsTrigger value="booking">Réservations</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Informations du centre
                  </CardTitle>
                  <CardDescription>
                    Configurez les informations de base de votre centre
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={centerForm.handleSubmit(onSubmitCenter)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="centerName">Nom du centre *</Label>
                        <Input
                          id="centerName"
                          {...centerForm.register("centerName")}
                          placeholder="Centre de Contrôle Technique XYZ"
                        />
                        {centerForm.formState.errors.centerName && (
                          <p className="text-red-500 text-sm mt-1">
                            {centerForm.formState.errors.centerName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="centerSlug">Identifiant URL *</Label>
                        <Input
                          id="centerSlug"
                          {...centerForm.register("centerSlug")}
                          placeholder="centre-xyz"
                        />
                        <p className="text-gray-500 text-xs mt-1">
                          URL publique: /booking/{centerForm.watch("centerSlug")}
                        </p>
                        {centerForm.formState.errors.centerSlug && (
                          <p className="text-red-500 text-sm mt-1">
                            {centerForm.formState.errors.centerSlug.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="centerAddress">Adresse</Label>
                      <Textarea
                        id="centerAddress"
                        {...centerForm.register("centerAddress")}
                        placeholder="123 Rue de la République, 75001 Paris"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="centerPhone">Téléphone</Label>
                      <Input
                        id="centerPhone"
                        {...centerForm.register("centerPhone")}
                        placeholder="01 23 45 67 89"
                      />
                    </div>

                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      {updateSettingsMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hours" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Horaires d'ouverture
                  </CardTitle>
                  <CardDescription>
                    Définissez vos horaires de travail pour chaque jour de la semaine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {days.map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-24">
                          <Switch
                            checked={workingHours[key as keyof WorkingHoursData].enabled}
                            onCheckedChange={(checked) => updateWorkingHours(key as keyof WorkingHoursData, 'enabled', checked)}
                          />
                          <Label className="ml-2">{label}</Label>
                        </div>
                        
                        {workingHours[key as keyof WorkingHoursData].enabled && (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={workingHours[key as keyof WorkingHoursData].start}
                              onChange={(e) => updateWorkingHours(key as keyof WorkingHoursData, 'start', e.target.value)}
                              className="w-32"
                            />
                            <span>à</span>
                            <Input
                              type="time"
                              value={workingHours[key as keyof WorkingHoursData].end}
                              onChange={(e) => updateWorkingHours(key as keyof WorkingHoursData, 'end', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => updateSettingsMutation.mutate({ ...centerForm.getValues(), workingHours })}
                    disabled={updateSettingsMutation.isPending}
                    className="mt-4"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Sauvegarde..." : "Sauvegarder les horaires"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="booking" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Paramètres de réservation
                  </CardTitle>
                  <CardDescription>
                    Configurez les paramètres pour les réservations en ligne
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={centerForm.handleSubmit(onSubmitCenter)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appointmentDuration">Durée par rendez-vous (minutes)</Label>
                        <Select
                          value={centerForm.watch("appointmentDuration")?.toString()}
                          onValueChange={(value) => centerForm.setValue("appointmentDuration", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">1 heure</SelectItem>
                            <SelectItem value="90">1h30</SelectItem>
                            <SelectItem value="120">2 heures</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="minBookingNotice">Préavis minimum (heures)</Label>
                        <Select
                          value={centerForm.watch("minBookingNotice")?.toString()}
                          onValueChange={(value) => centerForm.setValue("minBookingNotice", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 heures</SelectItem>
                            <SelectItem value="6">6 heures</SelectItem>
                            <SelectItem value="12">12 heures</SelectItem>
                            <SelectItem value="24">24 heures</SelectItem>
                            <SelectItem value="48">48 heures</SelectItem>
                            <SelectItem value="72">72 heures</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      {updateSettingsMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}