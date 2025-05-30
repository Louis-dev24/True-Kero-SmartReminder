import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Users, Calendar as CalendarIconLucide, Bell, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (type: 'clients' | 'appointments' | 'reminders', format: 'xlsx' | 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      let url = `/api/export/${type}?format=${format}`;
      
      if (type === 'appointments' && startDate && endDate) {
        url += `&start=${startDate.toISOString()}&end=${endDate.toISOString()}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export.${format}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Export réussi",
        description: `Le fichier ${filename} a été téléchargé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier d'export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleMonthlyReport = async () => {
    setIsExporting(true);
    try {
      const url = `/api/export/monthly-report?month=${reportMonth}&year=${reportYear}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `rapport_mensuel.pdf`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Rapport généré",
        description: `Le rapport mensuel ${filename} a été téléchargé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le rapport mensuel.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Rapports et exports</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Générez et exportez vos données dans différents formats
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Export des clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-500" />
                  Export des clients
                </CardTitle>
                <CardDescription>
                  Exportez la liste complète de vos clients avec leurs informations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('clients', 'xlsx')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('clients', 'csv')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('clients', 'pdf')}
                    disabled={isExporting}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Inclut : coordonnées, véhicules, dates de contrôle, statuts
                </p>
              </CardContent>
            </Card>

            {/* Export des rendez-vous */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIconLucide className="mr-2 h-5 w-5 text-green-500" />
                  Export des rendez-vous
                </CardTitle>
                <CardDescription>
                  Exportez les rendez-vous avec filtrage par date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PP", { locale: fr }) : "Sélectionner"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PP", { locale: fr }) : "Sélectionner"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('appointments', 'xlsx')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('appointments', 'csv')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('appointments', 'pdf')}
                    disabled={isExporting}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Inclut : dates, clients, véhicules, statuts, notes
                </p>
              </CardContent>
            </Card>

            {/* Export des rappels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-orange-500" />
                  Export des rappels
                </CardTitle>
                <CardDescription>
                  Exportez l'historique des rappels envoyés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('reminders', 'xlsx')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('reminders', 'csv')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('reminders', 'pdf')}
                    disabled={isExporting}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Inclut : dates d'envoi, types (email/SMS), statuts, erreurs
                </p>
              </CardContent>
            </Card>

            {/* Rapport mensuel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-purple-500" />
                  Rapport mensuel d'activité
                </CardTitle>
                <CardDescription>
                  Générez un rapport complet de votre activité mensuelle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Mois</Label>
                    <Select
                      value={reportMonth.toString()}
                      onValueChange={(value) => setReportMonth(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Année</Label>
                    <Select
                      value={reportYear.toString()}
                      onValueChange={(value) => setReportYear(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleMonthlyReport}
                  disabled={isExporting}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isExporting ? "Génération..." : "Générer le rapport PDF"}
                </Button>
                <p className="text-sm text-gray-500">
                  Inclut : statistiques, graphiques, rendez-vous, rappels
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Section d'aide */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Aide sur les exports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Format Excel (.xlsx)</h4>
                  <p className="text-gray-600">
                    Idéal pour l'analyse de données et l'utilisation dans des tableurs.
                    Conserve la mise en forme et permet les calculs.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Format CSV</h4>
                  <p className="text-gray-600">
                    Format universel compatible avec tous les logiciels.
                    Parfait pour l'import dans d'autres systèmes.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Format PDF</h4>
                  <p className="text-gray-600">
                    Format prêt à imprimer avec mise en page professionnelle.
                    Idéal pour l'archivage et la présentation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}