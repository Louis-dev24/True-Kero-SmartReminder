import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CalendarPlus } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface AlertsPanelProps {
  stats?: DashboardStats;
}

export default function AlertsPanel({ stats }: AlertsPanelProps) {
  // Calculate mock additional alert data
  const pendingReminders = 45; // This would come from API
  const newOnlineBookings = 8; // This would come from API

  const alerts = [
    {
      icon: AlertTriangle,
      iconColor: "text-red-500",
      title: "Contrôles expirés",
      description: `${stats?.expiredInspections || 0} clients ont un contrôle technique expiré`,
      urgent: (stats?.expiredInspections || 0) > 0,
    },
    {
      icon: Clock,
      iconColor: "text-yellow-500",
      title: "Rappels à envoyer",
      description: `${pendingReminders} rappels programmés pour aujourd'hui`,
      urgent: false,
    },
    {
      icon: CalendarPlus,
      iconColor: "text-green-500",
      title: "Nouveaux RDV en ligne",
      description: `${newOnlineBookings} nouvelles demandes de RDV`,
      urgent: false,
    },
  ];

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Alertes importantes</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0">
                <alert.icon className={`h-5 w-5 ${alert.iconColor}`} />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${alert.urgent ? 'text-red-900' : 'text-gray-900'}`}>
                  {alert.title}
                </p>
                <p className="text-xs text-gray-500">
                  {alert.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
