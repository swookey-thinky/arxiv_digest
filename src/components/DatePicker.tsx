import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

export function DatePicker({ startDate, endDate, onDateChange }: DatePickerProps) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const handlePreviousDay = () => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() - 1);
    newStart.setUTCHours(0, 0, 0, 0);

    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 1);
    newEnd.setUTCHours(0, 0, 0, 0);

    onDateChange(newStart, newEnd);
  };

  const handleNextDay = () => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + 1);
    newStart.setUTCHours(0, 0, 0, 0);

    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 1);
    newEnd.setUTCHours(0, 0, 0, 0);

    // Only allow moving forward if we're not going past today
    if (newEnd <= today) {
      onDateChange(newStart, newEnd);
    }
  };

  const handleDateChange = (date: Date) => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    end.setUTCHours(0, 0, 0, 0);

    onDateChange(start, end);
  };

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

  const canGoForward = () => {
    const nextDay = new Date(endDate);
    nextDay.setDate(endDate.getDate() + 1);
    nextDay.setUTCHours(23, 59, 59, 999);
    return nextDay <= today;
  };

  const formatUTCRange = (start: Date, end: Date) => {
    const startUTC = new Date(start);
    const endUTC = new Date(end);

    return `UTC Range: ${startUTC.toUTCString()} - ${endUTC.toUTCString()}`;
  };

  return (
    <div className="space-y-2 mb-8">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
          <button
            onClick={handlePreviousDay}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                max={today.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(new Date(e.target.value))}
                className="text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                max={today.toISOString().split('T')[0]}
                disabled
                className="text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0"
              />
            </div>
            <span className="text-gray-600 hidden lg:inline">({formatDateRange(startDate, endDate)})</span>
          </div>

          <button
            onClick={handleNextDay}
            disabled={!canGoForward()}
            className={`p-1 rounded-full transition-colors ${
              canGoForward()
                ? 'hover:bg-gray-100 text-gray-600'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="text-center">
        <span className="text-sm text-gray-500">{formatUTCRange(startDate, endDate)}</span>
      </div>
    </div>
  );
}