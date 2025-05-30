import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictingAppointmentId?: number;
}

interface ConflictInfo {
  hasConflict: boolean;
  conflictingAppointment?: any;
  suggestedSlots?: TimeSlot[];
}

interface ScheduleConflictCheckerProps {
  selectedDate: Date | undefined;
  selectedTime?: string;
  duration: number;
  excludeAppointmentId?: number;
  onTimeSlotSelect: (date: Date, time: string) => void;
  onConflictDetected?: (conflict: ConflictInfo) => void;
}

export default function ScheduleConflictChecker({
  selectedDate,
  selectedTime,
  duration,
  excludeAppointmentId,
  onTimeSlotSelect,
  onConflictDetected
}: ScheduleConflictCheckerProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);

  // Récupérer les créneaux disponibles pour la date sélectionnée
  const { data: availableSlots, isLoading } = useQuery({
    queryKey: ["/api/schedule/available-slots", selectedDate?.toISOString(), duration, excludeAppointmentId],
    enabled: !!selectedDate,
    queryFn: async () => {
      const params = new URLSearchParams({
        date: selectedDate!.toISOString(),
        duration: duration.toString(),
      });
      
      if (excludeAppointmentId) {
        params.append('excludeId', excludeAppointmentId.toString());
      }

      const response = await fetch(`/api/schedule/available-slots?${params}`);
      if (!response.ok) throw new Error('Failed to fetch available slots');
      return response.json() as Promise<TimeSlot[]>;
    },
  });

  // Vérifier les conflits quand une heure est sélectionnée
  useEffect(() => {
    if (selectedDate && selectedTime) {
      checkConflict();
    }
  }, [selectedDate, selectedTime, duration, excludeAppointmentId]);

  const checkConflict = async () => {
    if (!selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      const response = await fetch('/api/schedule/check-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: appointmentDate.toISOString(),
          duration,
          excludeAppointmentId
        })
      });

      if (response.ok) {
        const conflict = await response.json() as ConflictInfo;
        setConflictInfo(conflict);
        onConflictDetected?.(conflict);
      }
    } catch (error) {
      console.error('Error checking conflict:', error);
    }
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const start = new Date(slot.start).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const end = new Date(slot.end).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${start} - ${end}`;
  };

  const isSlotInPast = (slot: TimeSlot) => {
    return new Date(slot.start) < new Date();
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    const time = new Date(slot.start).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    onTimeSlotSelect(new Date(slot.start), time);
    setShowAlternatives(false);
  };

  const getSlotStatusBadge = (slot: TimeSlot) => {
    if (isSlotInPast(slot)) {
      return <Badge variant="outline" className="text-gray-400">Passé</Badge>;
    }
    if (slot.available) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Libre</Badge>;
    }
    return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Occupé</Badge>;
  };

  if (!selectedDate) {
    return (
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          Sélectionnez d'abord une date pour voir les créneaux disponibles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Affichage des créneaux disponibles */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-gray-500">Vérification des disponibilités...</span>
        </div>
      ) : availableSlots && availableSlots.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium mb-2">Créneaux disponibles :</h4>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {availableSlots.filter(slot => !isSlotInPast(slot)).map((slot, index) => (
              <Button
                key={index}
                variant={slot.available ? "outline" : "secondary"}
                size="sm"
                disabled={!slot.available}
                onClick={() => handleSlotSelect(slot)}
                className={`text-xs ${slot.available ? 'hover:bg-green-50' : 'opacity-50'}`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeSlot(slot)}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aucun créneau disponible pour cette date.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerte de conflit */}
      {conflictInfo?.hasConflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Conflit détecté !</strong> Ce créneau est déjà occupé
                {conflictInfo.conflictingAppointment && (
                  <span> par {conflictInfo.conflictingAppointment.client?.firstName} {conflictInfo.conflictingAppointment.client?.lastName}</span>
                )}
              </p>
              
              {conflictInfo.suggestedSlots && conflictInfo.suggestedSlots.length > 0 && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAlternatives(!showAlternatives)}
                  >
                    {showAlternatives ? 'Masquer' : 'Voir'} les créneaux alternatifs
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Créneaux alternatifs */}
      {showAlternatives && conflictInfo?.suggestedSlots && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="text-sm font-medium mb-3">Créneaux alternatifs suggérés :</h4>
          <div className="space-y-2">
            {conflictInfo.suggestedSlots.map((slot, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    {format(new Date(slot.start), 'dd/MM/yyyy', { locale: fr })} à {formatTimeSlot(slot)}
                  </span>
                  {getSlotStatusBadge(slot)}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  Sélectionner
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statut du créneau sélectionné */}
      {selectedTime && !conflictInfo?.hasConflict && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">
            Créneau disponible : {format(selectedDate, 'dd/MM/yyyy', { locale: fr })} à {selectedTime}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}