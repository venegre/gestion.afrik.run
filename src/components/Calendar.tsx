import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateStatus {
  hasDebt: boolean;
  hasAdvance: boolean;
}

interface CalendarProps {
  value: string;
  onChange: (date: string) => void;
  dateStatuses: Map<string, DateStatus>;
  className?: string;
}

export default function Calendar({ value, onChange, dateStatuses, className = '' }: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const selectedDate = value ? parseISO(value) : null;

  // Get the first day of the month
  const firstDayOfMonth = startOfMonth(currentMonth);
  
  // Get the day of the week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  let firstDayOfWeek = firstDayOfMonth.getDay();
  // Convert Sunday from 0 to 7 to match the French calendar (Monday = 1, ..., Sunday = 7)
  if (firstDayOfWeek === 0) firstDayOfWeek = 7;
  
  // Calculate empty days at the start
  const emptyDays = firstDayOfWeek - 1;

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      <div
        className="relative w-full cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          readOnly
          value={value ? format(new Date(value), 'd MMMM yyyy', { locale: fr }) : ''}
          placeholder="Sélectionner une date"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-2">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={(e) => { e.stopPropagation(); previousMonth(); }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); nextMonth(); }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: emptyDays }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {days.map(day => {
                const dateString = format(day, 'yyyy-MM-dd');
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const status = dateStatuses.get(dateString);

                let dotColor = '';
                if (status) {
                  if (status.hasAdvance) {
                    dotColor = 'bg-blue-500';
                  } else if (status.hasDebt) {
                    dotColor = 'bg-red-500';
                  }
                }

                return (
                  <div
                    key={dateString}
                    className="relative"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
                      className={`
                        w-full h-8 flex items-center justify-center rounded-full text-sm
                        ${isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                        ${!isSameMonth(day, currentMonth) && 'text-gray-400'}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                    {dotColor && (
                      <div 
                        className={`
                          absolute bottom-1 left-1/2 -translate-x-1/2 
                          w-1.5 h-1.5 rounded-full
                          ${dotColor}
                          ${isSelected ? 'bg-white' : ''}
                        `}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
