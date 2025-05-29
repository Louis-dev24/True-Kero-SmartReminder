import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "@/lib/types";

const clientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(10, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  licensePlate: z.string().optional(),
  lastInspectionDate: z.string().optional(),
  nextInspectionDate: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client | null;
  onSuccess: () => void;
}

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: client?.firstName || "",
      lastName: client?.lastName || "",
      phone: client?.phone || "",
      email: client?.email || "",
      vehicleBrand: client?.vehicleBrand || "",
      vehicleModel: client?.vehicleModel || "",
      licensePlate: client?.licensePlate || "",
      lastInspectionDate: client?.lastInspectionDate || "",
      nextInspectionDate: client?.nextInspectionDate || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      toast({
        title: "Client créé",
        description: "Le client a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le client.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      return apiRequest("PUT", `/api/clients/${client!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Client modifié",
        description: "Le client a été modifié avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le client.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    // Clean up empty strings
    const cleanData = {
      ...data,
      email: data.email || undefined,
      vehicleBrand: data.vehicleBrand || undefined,
      vehicleModel: data.vehicleModel || undefined,
      licensePlate: data.licensePlate || undefined,
      lastInspectionDate: data.lastInspectionDate || undefined,
      nextInspectionDate: data.nextInspectionDate || undefined,
    };

    if (client) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  return (
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
        <Label htmlFor="email">Email</Label>
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

      <div>
        <Label htmlFor="licensePlate">Immatriculation</Label>
        <Input
          id="licensePlate"
          {...form.register("licensePlate")}
          placeholder="AB-123-CD"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lastInspectionDate">Date du dernier contrôle</Label>
          <Input
            id="lastInspectionDate"
            type="date"
            {...form.register("lastInspectionDate")}
          />
        </div>
        <div>
          <Label htmlFor="nextInspectionDate">Date du prochain contrôle</Label>
          <Input
            id="nextInspectionDate"
            type="date"
            {...form.register("nextInspectionDate")}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {client ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
