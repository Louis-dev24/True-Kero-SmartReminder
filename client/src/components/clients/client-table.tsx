import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Calendar, Trash2, Users, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ClientWithStats } from "@/lib/types";

interface ClientTableProps {
  clients: ClientWithStats[];
  isLoading: boolean;
  onEditClient: (client: ClientWithStats) => void;
  onRefresh: () => void;
}

export default function ClientTable({ clients, isLoading, onEditClient, onRefresh }: ClientTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onRefresh();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client.",
        variant: "destructive",
      });
    },
  });

  const sendEmailReminderMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return apiRequest("POST", "/api/reminders/send-manual", { clientId });
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "Le rappel par email a été envoyé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le rappel par email.",
        variant: "destructive",
      });
    },
  });

  const sendSMSReminderMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return apiRequest("POST", "/api/reminders/send-sms", { clientId });
    },
    onSuccess: () => {
      toast({
        title: "SMS envoyé",
        description: "Le rappel par SMS a été envoyé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le rappel par SMS.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up_to_date":
        return "bg-green-100 text-green-800";
      case "expires_soon":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "up_to_date":
        return "À jour";
      case "expires_soon":
        return "Expire bientôt";
      case "expired":
        return "Expiré";
      default:
        return status;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return "-";
    }
  };

  const handleDeleteClick = (client: ClientWithStats) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${client.firstName} ${client.lastName} ?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Dernier contrôle</TableHead>
                  <TableHead>Prochain contrôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="ml-4">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow">
        <CardContent className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucun client trouvé
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Aucun client ne correspond à vos critères de recherche.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernier contrôle
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prochain contrôle
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-white font-medium text-sm">
                            {getInitials(client.firstName, client.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.vehicleBrand && client.vehicleModel 
                            ? `${client.vehicleBrand} ${client.vehicleModel}`
                            : "Véhicule non renseigné"
                          }
                          {client.licensePlate && ` • ${client.licensePlate}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.phone}</div>
                    <div className="text-sm text-gray-500">{client.email || "-"}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(client.lastInspectionDate)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(client.nextInspectionDate)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(client.status)}>
                      {getStatusLabel(client.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClient(client)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Modifier le client"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-900"
                        title="Planifier un rendez-vous"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      {client.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendEmailReminderMutation.mutate(client.id)}
                          disabled={sendEmailReminderMutation.isPending}
                          className="text-blue-600 hover:text-blue-900"
                          title="Envoyer rappel par email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {client.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendSMSReminderMutation.mutate(client.id)}
                          disabled={sendSMSReminderMutation.isPending}
                          className="text-purple-600 hover:text-purple-900"
                          title="Envoyer rappel par SMS"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(client)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer le client"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination - simplified for MVP */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button variant="outline" size="sm">
              Précédent
            </Button>
            <Button variant="outline" size="sm">
              Suivant
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage <span className="font-medium">1</span> à{" "}
                <span className="font-medium">{Math.min(clients.length, 10)}</span> sur{" "}
                <span className="font-medium">{clients.length}</span> résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button variant="outline" size="sm" className="rounded-l-md">
                  Précédent
                </Button>
                <Button variant="outline" size="sm" className="bg-primary-50 border-primary-500 text-primary-600">
                  1
                </Button>
                <Button variant="outline" size="sm" className="rounded-r-md">
                  Suivant
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
