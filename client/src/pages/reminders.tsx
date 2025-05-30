import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Mail, MessageSquare, Clock, CheckCircle, XCircle, Plus, Send, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TemplateForm from "@/components/reminders/template-form";
import type { ReminderTemplate } from "@/lib/types";

export default function Reminders() {
  const [activeTab, setActiveTab] = useState("pending");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingReminders, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/reminders/check"],
  });

  const { data: reminderTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/reminder-templates"],
  });

  const { data: reminderLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/reminder-logs"],
  });

  const sendAutomaticRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/reminders/send-automatic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to send reminders');
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Rappels envoyés",
        description: `${result.sent} rappels envoyés avec succès, ${result.failed} échecs sur ${result.total} clients`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/check"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les rappels automatiques",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return apiRequest("DELETE", `/api/reminder-templates/${templateId}`);
    },
    onSuccess: () => {
      toast({
        title: "Modèle supprimé",
        description: "Le modèle de rappel a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-templates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le modèle.",
        variant: "destructive",
      });
    },
  });

  const handleEditTemplate = (template: ReminderTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateForm(true);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowTemplateForm(true);
  };

  const handleCloseForm = () => {
    setShowTemplateForm(false);
    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = (templateId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const sendManualReminderMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await fetch('/api/reminders/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      });
      if (!response.ok) throw new Error('Failed to send reminder');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rappel envoyé",
        description: "Le rappel a été envoyé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/check"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le rappel",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Envoyé</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Échec</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'email' ? 
      <Badge variant="outline"><Mail className="w-3 h-3 mr-1" />Email</Badge> :
      <Badge variant="outline"><MessageSquare className="w-3 h-3 mr-1" />SMS</Badge>;
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) {
      return <Badge variant="destructive">Urgent ({days}j)</Badge>;
    } else if (days <= 15) {
      return <Badge variant="default" className="bg-orange-500">Bientôt ({days}j)</Badge>;
    } else {
      return <Badge variant="outline">Dans {days}j</Badge>;
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Gestion des rappels</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Configurez et suivez les rappels automatiques pour vos clients
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => sendAutomaticRemindersMutation.mutate()}
                  disabled={sendAutomaticRemindersMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendAutomaticRemindersMutation.isPending ? "Envoi..." : "Envoyer rappels automatiques"}
                </Button>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau template
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Rappels à envoyer</TabsTrigger>
              <TabsTrigger value="logs">Historique</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                    Clients nécessitant un rappel
                  </CardTitle>
                  <CardDescription>
                    Contrôles techniques arrivant à expiration dans les 30 prochains jours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : pendingReminders && Array.isArray(pendingReminders) && pendingReminders.length > 0 ? (
                    <div className="space-y-4">
                      <Alert>
                        <Bell className="h-4 w-4" />
                        <AlertDescription>
                          {Array.isArray(pendingReminders) ? pendingReminders.length : 0} client(s) nécessitent un rappel. Vous pouvez les envoyer automatiquement ou individuellement.
                        </AlertDescription>
                      </Alert>
                      
                      {Array.isArray(pendingReminders) && pendingReminders.map((reminder: any) => (
                        <div key={reminder.client.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-medium">
                                  {reminder.client.firstName} {reminder.client.lastName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {reminder.client.email} • {reminder.client.phone}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {reminder.client.vehicleBrand} {reminder.client.vehicleModel} • {reminder.client.licensePlate}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getUrgencyBadge(reminder.daysTillExpiration)}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendManualReminderMutation.mutate(reminder.client.id)}
                                disabled={sendManualReminderMutation.isPending}
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Envoyer
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Expiration: {new Date(reminder.expirationDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun rappel nécessaire</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Tous vos clients sont à jour avec leurs contrôles techniques.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Mail className="mr-2 h-5 w-5" />
                        Modèles de rappels
                      </CardTitle>
                      <CardDescription>
                        Créez et gérez vos modèles de messages personnalisés
                      </CardDescription>
                    </div>
                    <Button onClick={handleCreateTemplate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouveau modèle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : reminderTemplates && Array.isArray(reminderTemplates) && reminderTemplates.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Délai</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reminderTemplates.map((template: ReminderTemplate) => (
                          <TableRow key={template.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                {template.type === "email" && template.subject && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {template.subject}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {template.type === "email" ? (
                                <Badge variant="outline">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  SMS
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {template.daysBefore} jour{template.daysBefore > 1 ? 's' : ''} avant
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {template.isActive ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Actif
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  Inactif
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTemplate(template)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  disabled={deleteTemplateMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Mail className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun modèle de rappel
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Créez votre premier modèle pour automatiser vos rappels
                      </p>
                      <Button onClick={handleCreateTemplate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un modèle
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Historique des rappels
                  </CardTitle>
                  <CardDescription>
                    Liste de tous les rappels envoyés à vos clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : reminderLogs && Array.isArray(reminderLogs) && reminderLogs.length > 0 ? (
                    <div className="space-y-4">
                      {reminderLogs.map((log: any) => (
                        <div key={log.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getTypeBadge(log.type)}
                              {getStatusBadge(log.status)}
                              <span className="font-medium">Client #{log.clientId}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          {log.content && (
                            <p className="mt-2 text-sm text-gray-600">{log.content}</p>
                          )}
                          {log.errorMessage && (
                            <p className="mt-2 text-sm text-red-600">Erreur: {log.errorMessage}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun rappel</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucun rappel n'a encore été envoyé.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Templates de rappels</CardTitle>
                  <CardDescription>
                    Créez et gérez vos modèles de messages de rappel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Mail className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun template</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Créez votre premier modèle de rappel.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres des rappels</CardTitle>
                  <CardDescription>
                    Configurez les paramètres d'envoi automatique des rappels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Configuration à venir</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Les paramètres de rappels seront bientôt disponibles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialog pour le formulaire de modèles */}
      <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Modifier le modèle" : "Nouveau modèle de rappel"}
            </DialogTitle>
          </DialogHeader>
          <TemplateForm
            template={selectedTemplate}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}