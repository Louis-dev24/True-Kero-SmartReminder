import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, Mail, MessageSquare, Calendar, TrendingUp } from "lucide-react";

export default function Reminders() {
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/reminder-templates"],
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/reminder-logs"],
  });

  // Mock statistics for demonstration
  const stats = {
    smsSent: 1247,
    emailsSent: 892,
    responseRate: 23,
    appointmentRate: 67,
  };

  const recentActivity = [
    {
      id: 1,
      type: "sms",
      description: "45 SMS de rappel envoyés",
      time: "Il y a 2 heures",
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: 2,
      type: "email",
      description: "32 emails de rappel envoyés",
      time: "Il y a 4 heures",
      icon: Mail,
      bgColor: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "appointment",
      description: "8 nouveaux RDV pris",
      time: "Hier",
      icon: Calendar,
      bgColor: "bg-yellow-100",
      color: "text-yellow-600",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Rappels automatiques</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Configurez et gérez vos campagnes de rappels SMS et email
                </p>
              </div>
              <div className="flex space-x-3">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration des rappels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence des rappels
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="30days" defaultChecked />
                        <label htmlFor="30days" className="text-sm text-gray-700">
                          30 jours avant échéance
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="15days" defaultChecked />
                        <label htmlFor="15days" className="text-sm text-gray-700">
                          15 jours avant échéance
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="7days" defaultChecked />
                        <label htmlFor="7days" className="text-sm text-gray-700">
                          7 jours avant échéance
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="1day" />
                        <label htmlFor="1day" className="text-sm text-gray-700">
                          Veille de l'échéance
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canaux de communication
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="sms" defaultChecked />
                        <label htmlFor="sms" className="text-sm text-gray-700">
                          SMS
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="email" defaultChecked />
                        <label htmlFor="email" className="text-sm text-gray-700">
                          Email
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure d'envoi
                    </label>
                    <Select defaultValue="09:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">09:00</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Templates Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Templates de messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          SMS - Rappel 30 jours
                        </h4>
                        <Button variant="ghost" size="sm">
                          Modifier
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Bonjour {"{"}prenom{"}"}, votre contrôle technique expire le {"{"}date_echeance{"}"}. 
                        Prenez RDV sur {"{"}lien_rdv{"}"} - {"{"}nom_centre{"}"}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          Email - Rappel 15 jours
                        </h4>
                        <Button variant="ghost" size="sm">
                          Modifier
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sujet: Rappel contrôle technique - {"{"}nom_centre{"}"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics and History */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.smsSent.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">SMS envoyés ce mois</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.emailsSent.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Emails envoyés ce mois</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-primary">
                        {stats.responseRate}%
                      </div>
                      <div className="text-sm text-gray-500">Taux de réponse</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-green-600">
                        {stats.appointmentRate}%
                      </div>
                      <div className="text-sm text-gray-500">Taux de prise RDV</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Activité récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 ${activity.bgColor} rounded-full flex items-center justify-center`}>
                            <activity.icon className={`h-4 w-4 ${activity.color}`} />
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
