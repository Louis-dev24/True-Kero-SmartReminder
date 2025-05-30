import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Activity,
  Calendar,
  Mail,
  MessageSquare,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ScheduledTask {
  id: string;
  type: 'reminder_check' | 'reminder_send' | 'report_generation';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

interface SchedulerStatus {
  isRunning: boolean;
  taskCount: number;
  tasks: ScheduledTask[];
}

const taskTypeIcons = {
  reminder_check: CheckCircle,
  reminder_send: MessageSquare,
  report_generation: FileText
};

const taskTypeLabels = {
  reminder_check: "Vérification des rappels",
  reminder_send: "Envoi des rappels",
  report_generation: "Génération de rapports"
};

const frequencyLabels = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel"
};

export default function Scheduler() {
  const { toast } = useToast();
  const [executingTask, setExecutingTask] = useState<string | null>(null);

  const { data: schedulerStatus, isLoading } = useQuery<SchedulerStatus>({
    queryKey: ['/api/scheduler/status'],
    refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
  });

  const executeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/scheduler/task/${taskId}/execute`, 'POST');
    },
    onSuccess: (_, taskId) => {
      toast({
        title: "Tâche exécutée",
        description: "La tâche a été exécutée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/status'] });
      setExecutingTask(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'exécuter la tâche",
        variant: "destructive",
      });
      setExecutingTask(null);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, enabled }: { taskId: string; enabled: boolean }) => {
      const action = enabled ? 'enable' : 'disable';
      return apiRequest(`/api/scheduler/task/${taskId}/${action}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la tâche",
        variant: "destructive",
      });
    },
  });

  const handleExecuteTask = (taskId: string) => {
    setExecutingTask(taskId);
    executeTaskMutation.mutate(taskId);
  };

  const handleToggleTask = (taskId: string, enabled: boolean) => {
    toggleTaskMutation.mutate({ taskId, enabled });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Planificateur automatique</h1>
            <p className="text-muted-foreground">
              Gestion des tâches automatisées de rappels et rapports
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planificateur automatique</h1>
          <p className="text-muted-foreground">
            Gestion des tâches automatisées de rappels et rapports
          </p>
        </div>
      </div>

      {/* Statut global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Statut du planificateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {schedulerStatus?.isRunning ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Actif</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Inactif</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                État du planificateur
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {schedulerStatus?.taskCount || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Tâches configurées
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {schedulerStatus?.tasks?.filter(t => t.enabled).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Tâches actives
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des tâches */}
      <div className="grid gap-4">
        {schedulerStatus?.tasks?.map((task) => {
          const IconComponent = taskTypeIcons[task.type];
          const nextRun = new Date(task.nextRun);
          const lastRun = task.lastRun ? new Date(task.lastRun) : null;
          
          return (
            <Card key={task.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">
                          {taskTypeLabels[task.type]}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {frequencyLabels[task.frequency]} à {task.time}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant={task.enabled ? "default" : "secondary"}>
                      {task.enabled ? "Activée" : "Désactivée"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        Prochaine exécution
                      </div>
                      <div className="text-muted-foreground">
                        {format(nextRun, "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </div>
                      {lastRun && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Dernière: {format(lastRun, "dd/MM à HH:mm", { locale: fr })}
                        </div>
                      )}
                    </div>
                    
                    <Separator orientation="vertical" className="h-12" />
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={task.enabled}
                        onCheckedChange={(enabled) => handleToggleTask(task.id, enabled)}
                        disabled={toggleTaskMutation.isPending}
                      />
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExecuteTask(task.id)}
                        disabled={executingTask === task.id || executeTaskMutation.isPending}
                      >
                        {executingTask === task.id ? (
                          <RotateCcw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Exécuter
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Détails de configuration */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2 text-muted-foreground">
                        {task.type === 'reminder_check' && 'Vérifie les clients nécessitant des rappels'}
                        {task.type === 'reminder_send' && 'Envoie les rappels programmés par email/SMS'}
                        {task.type === 'report_generation' && 'Génère des rapports automatiques'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Fréquence:</span>
                      <span className="ml-2 text-muted-foreground">
                        {frequencyLabels[task.frequency]} à {task.time}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Comment ça fonctionne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium">Vérification des rappels</div>
                <div className="text-sm text-muted-foreground">
                  Analyse quotidiennement la base de clients pour identifier ceux nécessitant des rappels selon les modèles configurés.
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Envoi automatique</div>
                <div className="text-sm text-muted-foreground">
                  Traite la file d'attente des rappels et les envoie par email ou SMS selon les préférences.
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium">Rapports automatiques</div>
                <div className="text-sm text-muted-foreground">
                  Génère des rapports périodiques sur l'activité et les performances du centre.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}