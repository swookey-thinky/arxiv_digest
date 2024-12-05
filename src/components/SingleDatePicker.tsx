import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SingleDatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export function SingleDatePicker({ selectedDate, onChange }: SingleDatePickerProps) {
  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    onChange(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    if (nextDay <= new Date()) {
      onChange(nextDay);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePreviousDay}
        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      <div className="w-28 text-center">
        <DatePicker
          selected={selectedDate}
          onChange={onChange}
          dateFormat="yyyy-MM-dd"
          className="bg-transparent focus:outline-none text-gray-700 text-center w-full"
          maxDate={new Date()}
        />
      </div>
      <button
        onClick={handleNextDay}
        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        aria-label="Next day"
        disabled={selectedDate >= new Date()}
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}