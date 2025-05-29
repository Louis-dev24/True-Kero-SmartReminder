import { useQuery } from "@tanstack/react-query";
import StatsGrid from "@/components/dashboard/stats-grid";
import CalendarWidget from "@/components/dashboard/calendar-widget";
import UpcomingAppointments from "@/components/dashboard/upcoming-appointments";
import AlertsPanel from "@/components/dashboard/alerts-panel";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useState } from "react";
import ClientForm from "@/components/clients/client-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Dashboard() {
  const [showClientForm, setShowClientForm] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: upcomingAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/dashboard/upcoming-appointments"],
  });

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Vue d'ensemble de votre centre de contrôle technique
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button onClick={() => setShowClientForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau client
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Statistics Cards */}
          <div className="mb-8">
            <StatsGrid stats={stats} isLoading={statsLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <CalendarWidget />
            </div>

            {/* Upcoming Appointments & Alerts */}
            <div className="space-y-6">
              <UpcomingAppointments 
                appointments={upcomingAppointments} 
                isLoading={appointmentsLoading} 
              />
              <AlertsPanel stats={stats} />
            </div>
          </div>
        </div>
      </main>

      {/* Client Form Modal */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => setShowClientForm(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
