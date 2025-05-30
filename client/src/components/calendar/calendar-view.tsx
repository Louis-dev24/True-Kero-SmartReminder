import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { AppointmentWithClient } from "@/lib/types";

interface CalendarViewProps {
  appointments: AppointmentWithClient[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithClient) => void;
  isLoading?: boolean;
}

export default function CalendarView({ appointments, onDateClick, onAppointmentClick, isLoading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithClient | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lundi
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: AppointmentWithClient[] } = {};
    
    appointments.forEach(appointment => {
      const dateKey = format(new Date(appointment.appointmentDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });

    return grouped;
  }, [appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'scheduled':
        return 'Programmé';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (date: Date) => {
    const dayAppointments = appointmentsByDate[format(date, 'yyyy-MM-dd')] || [];
    if (dayAppointments.length > 0) {
      // Si il y a des rendez-vous, ouvrir le premier
      setSelectedAppointment(dayAppointments[0]);
    } else {
      // Sinon, créer un nouveau rendez-vous
      onDateClick(date);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Calendrier des rendez-vous
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-medium min-w-48 text-center">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate[dayKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dayKey}
                  className={`
                    min-h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                    ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment, index) => (
                      <div
                        key={appointment.id}
                        className={`text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 ${getStatusColor(appointment.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appointment);
                        }}
                      >
                        <div className="truncate font-medium">
                          {appointment.client.firstName} {appointment.client.lastName}
                        </div>
                        <div className="truncate">
                          {format(new Date(appointment.appointmentDate), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>Programmé</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>Confirmé</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
              <span>Terminé</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>Annulé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de détails du rendez-vous */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-medium">
                    {selectedAppointment.client.firstName} {selectedAppointment.client.lastName}
                  </span>
                </div>
                <Badge variant="secondary" className={getStatusColor(selectedAppointment.status)}>
                  {getStatusText(selectedAppointment.status)}
                </Badge>
              </div>
              
              <div>
                <strong>Date et heure :</strong>
                <div className="text-gray-600">
                  {format(new Date(selectedAppointment.appointmentDate), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                </div>
              </div>

              <div>
                <strong>Contact :</strong>
                <div className="text-gray-600">
                  {selectedAppointment.client.phone}
                  {selectedAppointment.client.email && ` • ${selectedAppointment.client.email}`}
                </div>
              </div>

              {selectedAppointment.client.vehicleBrand && (
                <div>
                  <strong>Véhicule :</strong>
                  <div className="text-gray-600">
                    {selectedAppointment.client.vehicleBrand} {selectedAppointment.client.vehicleModel}
                    {selectedAppointment.client.licensePlate && ` • ${selectedAppointment.client.licensePlate}`}
                  </div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <strong>Notes :</strong>
                  <div className="text-gray-600">{selectedAppointment.notes}</div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedAppointment(null);
                    onAppointmentClick(selectedAppointment);
                  }}
                >
                  Modifier
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}