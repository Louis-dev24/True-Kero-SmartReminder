import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

interface DayCapacity {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  utilizationRate: number;
}

interface DayCapacityIndicatorProps {
  date: Date;
  compact?: boolean;
}

export default function DayCapacityIndicator({ date, compact = false }: DayCapacityIndicatorProps) {
  const { data: capacity, isLoading } = useQuery({
    queryKey: ["/api/schedule/day-capacity", date.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/schedule/day-capacity?date=${date.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch day capacity');
      return response.json() as Promise<DayCapacity>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        {!compact && <span className="text-sm text-gray-500">Chargement...</span>}
      </div>
    );
  }

  if (!capacity) return null;

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return "text-red-600";
    if (rate >= 70) return "text-orange-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getUtilizationBadge = (rate: number) => {
    if (rate >= 90) return <Badge variant="destructive">Complet</Badge>;
    if (rate >= 70) return <Badge variant="default" className="bg-orange-500">Chargé</Badge>;
    if (rate >= 50) return <Badge variant="default" className="bg-yellow-500">Modéré</Badge>;
    return <Badge variant="default" className="bg-green-500">Disponible</Badge>;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              capacity.utilizationRate >= 90 ? 'bg-red-500' :
              capacity.utilizationRate >= 70 ? 'bg-orange-500' :
              capacity.utilizationRate >= 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${capacity.utilizationRate}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${getUtilizationColor(capacity.utilizationRate)}`}>
          {Math.round(capacity.utilizationRate)}%
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium">Capacité du jour</span>
        </div>
        {getUtilizationBadge(capacity.utilizationRate)}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Utilisation</span>
          <span className={`font-medium ${getUtilizationColor(capacity.utilizationRate)}`}>
            {Math.round(capacity.utilizationRate)}%
          </span>
        </div>
        <Progress value={capacity.utilizationRate} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-lg">{capacity.totalSlots}</div>
          <div className="text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-green-600">{capacity.availableSlots}</div>
          <div className="text-gray-500">Libres</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-red-600">{capacity.occupiedSlots}</div>
          <div className="text-gray-500">Occupés</div>
        </div>
      </div>

      {capacity.utilizationRate >= 90 && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Journée complète - plus de créneaux disponibles</span>
        </div>
      )}

      {capacity.utilizationRate >= 70 && capacity.utilizationRate < 90 && (
        <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 p-2 rounded">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Journée chargée - {capacity.availableSlots} créneaux restants</span>
        </div>
      )}
    </div>
  );
}