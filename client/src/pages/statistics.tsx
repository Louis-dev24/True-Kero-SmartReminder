import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Calendar, Bell, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Statistics() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mock data for charts
  const monthlyData = [
    { month: "Jan", appointments: 65, reminders: 120, newClients: 12 },
    { month: "Fév", appointments: 78, reminders: 145, newClients: 15 },
    { month: "Mar", appointments: 82, reminders: 138, newClients: 18 },
    { month: "Avr", appointments: 89, reminders: 167, newClients: 22 },
    { month: "Mai", appointments: 95, reminders: 189, newClients: 19 },
    { month: "Juin", appointments: 88, reminders: 176, newClients: 16 },
  ];

  const weeklyAppointments = [
    { day: "Lun", appointments: 12 },
    { day: "Mar", appointments: 15 },
    { day: "Mer", appointments: 18 },
    { day: "Jeu", appointments: 14 },
    { day: "Ven", appointments: 16 },
    { day: "Sam", appointments: 8 },
    { day: "Dim", appointments: 0 },
  ];

  const statusDistribution = [
    { status: "À jour", count: 180, percentage: 72 },
    { status: "Expire bientôt", count: 45, percentage: 18 },
    { status: "Expiré", count: 25, percentage: 10 },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Statistiques</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Analysez les performances de votre centre de contrôle technique
                </p>
              </div>
              <div className="flex space-x-3">
                <Select defaultValue="6months">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">Ce mois</SelectItem>
                    <SelectItem value="3months">3 derniers mois</SelectItem>
                    <SelectItem value="6months">6 derniers mois</SelectItem>
                    <SelectItem value="1year">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total clients</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.totalClients || 0}
                    </p>
                    <p className="text-xs text-green-600">+12% ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">RDV ce mois</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.monthlyAppointments || 0}
                    </p>
                    <p className="text-xs text-green-600">+8% vs mois dernier</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Rappels envoyés</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.remindersSent || 0}
                    </p>
                    <p className="text-xs text-blue-600">342 ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Taux de conversion</p>
                    <p className="text-2xl font-semibold text-gray-900">67%</p>
                    <p className="text-xs text-green-600">+3% ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Évolution mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Rendez-vous"
                    />
                    <Line
                      type="monotone"
                      dataKey="reminders"
                      stroke="#16a34a"
                      strokeWidth={2}
                      name="Rappels"
                    />
                    <Line
                      type="monotone"
                      dataKey="newClients"
                      stroke="#dc2626"
                      strokeWidth={2}
                      name="Nouveaux clients"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Rendez-vous par jour (cette semaine)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyAppointments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Client Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des statuts clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            item.status === "À jour"
                              ? "bg-green-500"
                              : item.status === "Expire bientôt"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900">{item.status}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{item.count}</div>
                        <div className="text-xs text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métriques de performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taux d'ouverture SMS</span>
                      <span className="font-semibold">94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taux d'ouverture Email</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taux de prise de RDV</span>
                      <span className="font-semibold">67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "67%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Satisfaction client</span>
                      <span className="font-semibold">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
