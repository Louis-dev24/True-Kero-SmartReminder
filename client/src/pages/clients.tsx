import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Upload, Search } from "lucide-react";
import ClientTable from "@/components/clients/client-table";
import ClientForm from "@/components/clients/client-form";

export default function Clients() {
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["/api/clients", { search, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    },
  });

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleCloseForm = () => {
    setShowClientForm(false);
    setEditingClient(null);
    refetch();
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Gestion des clients</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gérez vos clients et leurs informations de contrôle technique
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importer CSV
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
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher un client
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Nom, téléphone ou email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut contrôle
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="up_to_date">À jour</SelectItem>
                      <SelectItem value="expired">Expiré</SelectItem>
                      <SelectItem value="expires_soon">Expire bientôt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trier par
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Nom A-Z" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Nom A-Z</SelectItem>
                      <SelectItem value="name_desc">Nom Z-A</SelectItem>
                      <SelectItem value="created_desc">Date d'ajout</SelectItem>
                      <SelectItem value="next_inspection">Prochain contrôle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Clients Table */}
          <ClientTable
            clients={clients || []}
            isLoading={isLoading}
            onEditClient={handleEditClient}
            onRefresh={refetch}
          />
        </div>
      </main>

      {/* Client Form Modal */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
