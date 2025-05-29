import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { AppointmentWithClient, Client } from "@/lib/types";

const appointmentSchema = z.object({
  clientId: z.number().min(1, "Veuillez sélectionner un client"),
  appointmentDate: z.string().min(1, "La date est requise"),
  appointmentTime: z.string().min(1, "L'heure est requise"),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment?: AppointmentWithClient | null;
  onSuccess: () => void;
}

export default function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: appointment?.clientId || 0,
      appointmentDate: appointment?.appointmentDate 
        ? format(new Date(appointment.appointmentDate), "yyyy-MM-dd")
        : "",
      appointmentTime: appointment?.appointmentDate 
        ? format(new Date(appointment.appointmentDate), "HH:mm")
        : "",
      status: appointment?.status || "scheduled",
      notes: appointment?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const appointmentDate = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      return apiRequest("POST", "/api/appointments", {
        clientId: data.clientId,
        appointmentDate: appointmentDate.toISOString(),
        status: data.status,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rendez-vous créé",
        description: "Le rendez-vous a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/upcoming-appointments"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const appointmentDate = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      return apiRequest("PUT", `/api/appointments/${appointment!.id}`, {
        clientId: data.clientId,
        appointmentDate: appointmentDate.toISOString(),
        status: data.status,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rendez-vous modifié",
        description: "Le rendez-vous a été modifié avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/upcoming-appointments"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/appointments/${appointment!.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Rendez-vous supprimé",
        description: "Le rendez-vous a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/upcoming-appointments"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rendez-vous.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    if (appointment) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="clientId">Client *</Label>
        <Select 
          value={form.watch("clientId")?.toString() || ""} 
          onValueChange={(value) => form.setValue("clientId", parseInt(value))}
        >
          <SelectTrigger className={form.formState.errors.clientId ? "border-red-500" : ""}>
            <SelectValue placeholder="Sélectionner un client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client: Client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.firstName} {client.lastName} - {client.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.clientId && (
          <p className="text-red-500 text-xs mt-1">
            {form.formState.errors.clientId.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="appointmentDate">Date *</Label>
          <Input
            id="appointmentDate"
            type="date"
            {...form.register("appointmentDate")}
            className={form.formState.errors.appointmentDate ? "border-red-500" : ""}
          />
          {form.formState.errors.appointmentDate && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.appointmentDate.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="appointmentTime">Heure *</Label>
          <Input
            id="appointmentTime"
            type="time"
            {...form.register("appointmentTime")}
            className={form.formState.errors.appointmentTime ? "border-red-500" : ""}
          />
          {form.formState.errors.appointmentTime && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.appointmentTime.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="status">Statut</Label>
        <Select 
          value={form.watch("status")} 
          onValueChange={(value) => form.setValue("status", value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Planifié</SelectItem>
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Notes ou commentaires..."
          rows={3}
        />
      </div>

      <div className="flex justify-between pt-4">
        <div>
          {appointment && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          )}
        </div>
        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {appointment ? "Modifier" : "Créer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
