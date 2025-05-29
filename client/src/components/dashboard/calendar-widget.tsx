import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { fr } from "date-fns/locale";

export default function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days to complete the calendar grid
  const startDay = getDay(monthStart);
  const paddingStart = startDay === 0 ? 6 : startDay - 1; // Convert Sunday = 0 to Monday = 0

  const calendarDays = [
    ...Array(paddingStart).fill(null),
    ...daysInMonth,
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Mock appointment data - in real app, this would come from props or API
  const hasAppointment = (date: Date) => {
    const day = date.getDate();
    // Mock: show appointments on 15th and 22nd
    return day === 15 || day === 22;
  };

  const getAppointmentCount = (date: Date) => {
    const day = date.getDate();
    if (day === 15) return 1;
    if (day === 22) return 2;
    return 0;
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            Calendrier des rendez-vous
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[120px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2"></div>;
            }

            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const dayHasAppointment = hasAppointment(day);
            const appointmentCount = getAppointmentCount(day);

            return (
              <div
                key={day.toISOString()}
                className={`p-2 text-center text-sm cursor-pointer rounded transition-colors ${
                  !isCurrentMonth
                    ? "text-gray-300"
                    : isCurrentDay
                    ? "bg-primary-100 text-primary-800 font-medium"
                    : dayHasAppointment
                    ? "bg-green-100 text-green-800 font-medium"
                    : "hover:bg-gray-50"
                }`}
              >
                <div>{day.getDate()}</div>
                {dayHasAppointment && isCurrentMonth && (
                  <div className="mt-1 flex justify-center">
                    {appointmentCount === 1 ? (
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    ) : (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
