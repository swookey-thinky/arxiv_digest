import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

export function DatePicker({ startDate, endDate, onDateChange }: DatePickerProps) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const formatDateRange = (start: Date, end: Date) => {
    const startUTC = new Date(start);
    startUTC.setUTCHours(0, 0, 0, 0);
    const endUTC = new Date(end);
    endUTC.setUTCHours(0, 0, 0, 0);

    if (startUTC.getTime() === endUTC.getTime()) {
      return startUTC.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return `${startUTC.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })} - ${endUTC.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    newStart.setUTCHours(0, 0, 0, 0);
    
    if (newStart > endDate) {
      onDateChange(newStart, newStart);
    } else {
      onDateChange(newStart, endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    newEnd.setUTCHours(0, 0, 0, 0);
    
    if (newEnd < startDate) {
      onDateChange(newEnd, newEnd);
    } else {
      onDateChange(startDate, newEnd);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
        <Calendar className="w-5 h-5 text-gray-600" />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate.toISOString().split('T')[0]}
            max={today.toISOString().split('T')[0]}
            onChange={handleStartDateChange}
            className="text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate.toISOString().split('T')[0]}
            max={today.toISOString().split('T')[0]}
            min={startDate.toISOString().split('T')[0]}
            onChange={handleEndDateChange}
            className="text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0"
          />
        </div>
        <span className="text-gray-600 hidden lg:inline">({formatDateRange(startDate, endDate)})</span>
      </div>
    </div>
  );
}