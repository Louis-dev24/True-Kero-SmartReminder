import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Bell, AlertTriangle } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface StatsGridProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const statCards = [
    {
      title: "Total clients",
      value: stats?.totalClients || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "RDV ce mois",
      value: stats?.monthlyAppointments || 0,
      icon: Calendar,
      color: "bg-green-500",
    },
    {
      title: "Rappels envoyés",
      value: stats?.remindersSent || 0,
      icon: Bell,
      color: "bg-yellow-500",
    },
    {
      title: "Contrôles expirés",
      value: stats?.expiredInspections || 0,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-white rounded-lg shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
