import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, Bell, Globe, BarChart3, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary rounded-lg p-3">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h1 className="ml-3 text-3xl font-bold text-gray-900">TechControl Pro</h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gérez votre centre de contrôle technique en toute simplicité
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automatisez vos rappels clients, gérez vos rendez-vous et optimisez votre activité 
            avec notre solution SaaS complète dédiée aux centres de contrôle technique.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Commencer maintenant
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Gestion des clients</CardTitle>
              <CardDescription>
                Base de données complète de vos clients avec historique des contrôles techniques
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Planning intelligent</CardTitle>
              <CardDescription>
                Calendrier intégré avec vue d'ensemble de tous vos rendez-vous
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Rappels automatiques</CardTitle>
              <CardDescription>
                Envoi automatique de SMS et emails pour les échéances de contrôle technique
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Prise de RDV en ligne</CardTitle>
              <CardDescription>
                Page publique personnalisée pour la prise de rendez-vous en ligne 24h/24
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Statistiques détaillées</CardTitle>
              <CardDescription>
                Tableaux de bord avec métriques clés de votre activité
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Car className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Interface intuitive</CardTitle>
              <CardDescription>
                Navigation ultra simple, aucune compétence technique requise
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-primary text-white">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">
                Prêt à moderniser votre centre de contrôle technique ?
              </h3>
              <p className="text-primary-100 mb-6 text-lg">
                Rejoignez les centaines de centres qui nous font déjà confiance
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-3"
                onClick={() => window.location.href = '/api/login'}
              >
                Démarrer gratuitement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
