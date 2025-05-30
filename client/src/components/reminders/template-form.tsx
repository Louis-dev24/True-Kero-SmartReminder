import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, MessageSquare, Info, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertReminderTemplateSchema } from "@shared/schema";
import { z } from "zod";
import type { ReminderTemplate } from "@/lib/types";

const templateFormSchema = insertReminderTemplateSchema.extend({
  id: z.number().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  template?: ReminderTemplate | null;
  onSuccess: () => void;
}

export default function TemplateForm({ template, onSuccess }: TemplateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      type: template?.type || "email",
      daysBefore: template?.daysBefore || 30,
      subject: template?.subject || "",
      content: template?.content || "",
      isActive: template?.isActive ?? true,
    },
  });

  const templateType = form.watch("type");

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { id, ...templateData } = data;
      return apiRequest("POST", "/api/reminder-templates", templateData);
    },
    onSuccess: () => {
      toast({
        title: "Modèle créé",
        description: "Le modèle de rappel a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-templates"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le modèle.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { id, ...templateData } = data;
      return apiRequest("PUT", `/api/reminder-templates/${template?.id}`, templateData);
    },
    onSuccess: () => {
      toast({
        title: "Modèle mis à jour",
        description: "Le modèle de rappel a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-templates"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le modèle.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    if (template) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Variables disponibles pour les modèles
  const availableVariables = [
    { key: "{CLIENT_NAME}", description: "Nom complet du client" },
    { key: "{FIRST_NAME}", description: "Prénom du client" },
    { key: "{LAST_NAME}", description: "Nom de famille du client" },
    { key: "{CENTER_NAME}", description: "Nom du centre" },
    { key: "{EXPIRATION_DATE}", description: "Date d'expiration du contrôle" },
    { key: "{DAYS_LEFT}", description: "Nombre de jours restants" },
    { key: "{VEHICLE_INFO}", description: "Informations du véhicule" },
    { key: "{CENTER_PHONE}", description: "Téléphone du centre" },
    { key: "{CENTER_ADDRESS}", description: "Adresse du centre" },
  ];

  // Modèles prédéfinis
  const getDefaultContent = (type: "email" | "sms", scenario: string) => {
    const templates = {
      email: {
        expiring: {
          subject: "Rappel : Contrôle technique à renouveler - {CLIENT_NAME}",
          content: `Bonjour {CLIENT_NAME},

Nous vous rappelons que le contrôle technique de votre véhicule {VEHICLE_INFO} expire le {EXPIRATION_DATE}.

Il vous reste {DAYS_LEFT} jours pour effectuer votre contrôle technique.

Pour prendre rendez-vous, contactez-nous :
📞 {CENTER_PHONE}
📍 {CENTER_ADDRESS}

Cordialement,
L'équipe de {CENTER_NAME}`
        },
        expired: {
          subject: "URGENT : Contrôle technique expiré - {CLIENT_NAME}",
          content: `Bonjour {CLIENT_NAME},

ATTENTION : Le contrôle technique de votre véhicule {VEHICLE_INFO} a expiré le {EXPIRATION_DATE}.

Vous ne pouvez plus circuler avec ce véhicule. Prenez rendez-vous dès maintenant :
📞 {CENTER_PHONE}
📍 {CENTER_ADDRESS}

Cordialement,
L'équipe de {CENTER_NAME}`
        }
      },
      sms: {
        expiring: {
          content: "Bonjour {FIRST_NAME}, votre contrôle technique expire le {EXPIRATION_DATE} (dans {DAYS_LEFT} jours). Prenez RDV chez {CENTER_NAME} au {CENTER_PHONE}. STOP pour vous désabonner."
        },
        expired: {
          content: "URGENT {FIRST_NAME} : votre contrôle technique a expiré le {EXPIRATION_DATE}. Circulation interdite. RDV immédiat : {CENTER_PHONE}. STOP pour vous désabonner."
        }
      }
    };

    return templates[type][scenario as keyof typeof templates[typeof type]];
  };

  const applyTemplate = (scenario: string) => {
    const template = getDefaultContent(templateType, scenario);
    if (template) {
      if (templateType === "email" && "subject" in template) {
        form.setValue("subject", template.subject);
        form.setValue("content", template.content);
      } else if (templateType === "sms") {
        form.setValue("content", template.content);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {templateType === "email" ? (
              <Mail className="mr-2 h-5 w-5" />
            ) : (
              <MessageSquare className="mr-2 h-5 w-5" />
            )}
            {template ? "Modifier le modèle" : "Nouveau modèle de rappel"}
          </CardTitle>
          <CardDescription>
            Personnalisez les messages envoyés automatiquement aux clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Configuration de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du modèle *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Rappel 30 jours avant expiration"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Type de rappel *</Label>
                <Select 
                  value={form.watch("type")} 
                  onValueChange={(value) => form.setValue("type", value as "email" | "sms")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="daysBefore">Jours avant expiration *</Label>
                <Input
                  id="daysBefore"
                  type="number"
                  min="0"
                  max="365"
                  {...form.register("daysBefore", { valueAsNumber: true })}
                  placeholder="30"
                />
                {form.formState.errors.daysBefore && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.daysBefore.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Modèle actif</Label>
              </div>
            </div>

            {/* Modèles prédéfinis */}
            <div>
              <Label>Modèles prédéfinis</Label>
              <div className="flex space-x-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate("expiring")}
                >
                  Expiration proche
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate("expired")}
                >
                  Déjà expiré
                </Button>
              </div>
            </div>

            {/* Sujet pour email */}
            {templateType === "email" && (
              <div>
                <Label htmlFor="subject">Sujet de l'email *</Label>
                <Input
                  id="subject"
                  {...form.register("subject")}
                  placeholder="Rappel : Contrôle technique à renouveler"
                />
                {form.formState.errors.subject && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.subject.message}
                  </p>
                )}
              </div>
            )}

            {/* Contenu du message */}
            <div>
              <Label htmlFor="content">
                Contenu du {templateType === "email" ? "message" : "SMS"} *
              </Label>
              <Textarea
                id="content"
                rows={templateType === "email" ? 8 : 4}
                {...form.register("content")}
                placeholder={
                  templateType === "email"
                    ? "Bonjour {CLIENT_NAME}, nous vous rappelons que..."
                    : "Bonjour {FIRST_NAME}, votre contrôle technique..."
                }
              />
              {templateType === "sms" && (
                <p className="text-sm text-gray-500 mt-1">
                  {form.watch("content")?.length || 0}/160 caractères
                </p>
              )}
              {form.formState.errors.content && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>

            {/* Variables disponibles */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Variables disponibles :</strong>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  {availableVariables.map((variable) => (
                    <div key={variable.key} className="flex">
                      <code className="bg-gray-100 px-1 rounded text-xs mr-2">
                        {variable.key}
                      </code>
                      <span className="text-gray-600 text-xs">{variable.description}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending || updateMutation.isPending 
                  ? "Sauvegarde..." 
                  : template ? "Mettre à jour" : "Créer le modèle"
                }
              </Button>
              <Button type="button" variant="outline" onClick={onSuccess}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}