import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar as CalendarIcon, List, Grid } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppointmentForm from "@/components/appointments/appointment-form";
import CalendarView from "@/components/calendar/calendar-view";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export default function Appointments() {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const startDate = startOfMonth(selectedDate);
  const endDate = endOfMonth(selectedDate);

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["/api/appointments", { startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      const response = await fetch(`/api/appointments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

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

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleCloseForm = () => {
    setShowAppointmentForm(false);
    setEditingAppointment(null);
    refetch();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowAppointmentForm(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    handleEditAppointment(appointment);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Rendez-vous</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gérez vos rendez-vous de contrôle technique
                </p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => setShowAppointmentForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau rendez-vous
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list")}>
            <TabsList className="mb-6">
              <TabsTrigger value="calendar" className="flex items-center">
                <Grid className="mr-2 h-4 w-4" />
                Vue calendrier
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center">
                <List className="mr-2 h-4 w-4" />
                Vue liste
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <CalendarView
                appointments={appointments || []}
                onDateClick={handleDateClick}
                onAppointmentClick={handleAppointmentClick}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="list">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Calendar */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Calendrier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={fr}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Appointments List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Rendez-vous - {format(selectedDate, "MMMM yyyy", { locale: fr })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : appointments && appointments.length > 0 ? (
                    <div className="space-y-4">
                      {appointments.map((appointment: any) => (
                        <div
                          key={appointment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {appointment.client.firstName} {appointment.client.lastName}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {appointment.client.phone}
                                  </p>
                                  {appointment.client.vehicleBrand && (
                                    <p className="text-sm text-gray-500">
                                      {appointment.client.vehicleBrand} {appointment.client.vehicleModel}
                                      {appointment.client.licensePlate && ` • ${appointment.client.licensePlate}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {format(new Date(appointment.appointmentDate), "HH:mm")}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(appointment.appointmentDate), "dd/MM/yyyy")}
                              </p>
                              <Badge className={`mt-2 ${getStatusColor(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                              {appointment.isOnlineBooking && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    En ligne
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun rendez-vous
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucun rendez-vous prévu pour cette période.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Form Modal */}
      <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={editingAppointment}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
