import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { AppointmentWithClient } from "@/lib/types";

interface UpcomingAppointmentsProps {
  appointments?: AppointmentWithClient[];
  isLoading: boolean;
}

export default function UpcomingAppointments({ appointments, isLoading }: UpcomingAppointmentsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "scheduled":
        return "Planifié";
      case "completed":
        return "Terminé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const formatAppointmentTime = (date: Date) => {
    if (isToday(date)) {
      return `Aujourd'hui ${format(date, "HH:mm")}`;
    }
    if (isTomorrow(date)) {
      return `Demain ${format(date, "HH:mm")}`;
    }
    return format(date, "EEEE HH:mm", { locale: fr });
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Prochains RDV</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center animate-pulse">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="flex-shrink-0">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Prochains RDV</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {appointments && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${
                    appointment.status === "confirmed" ? "bg-green-500" :
                    appointment.status === "scheduled" ? "bg-blue-500" :
                    "bg-yellow-500"
                  }`}></div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {appointment.client.firstName} {appointment.client.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatAppointmentTime(new Date(appointment.appointmentDate))}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge className={getStatusColor(appointment.status)}>
                    {getStatusLabel(appointment.status)}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-6">
              <Button 
                variant="ghost"
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Voir tous les RDV
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucun rendez-vous à venir
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun rendez-vous planifié pour les prochains jours.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
