'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomDatePicker({ 
  value, 
  onChange, 
  placeholder = 'Выберите дату' 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  // Генерация дней месяца
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Пустые ячейки для дней недели до первого числа
    for (let i = 0; i < (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-[#F3F4F6] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:border-[#5FC36C] transition-colors text-left"
      >
        <span className={value ? 'text-black' : 'text-gray-400'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
          {/* Навигация по месяцам */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Сетка дней */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const isSelected = value === dateString;
              
              return (
                <button
                  key={dateString}
                  onClick={() => handleDateSelect(date)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-[#5FC36C] text-white' : 'text-gray-700 hover:bg-[#E3F2E3]'}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}