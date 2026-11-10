'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  options: { value: string, label: string }[],
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      {/* Кнопка (закрытое состояние) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-lg p-3 text-sm font-medium flex items-center justify-between transition-all duration-200 ${
          isOpen 
            ? 'border-[#5FC36C] ring-2 ring-[#5FC36C]/20 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder || 'Выберите...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Выпадающий список (открытое состояние) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] overflow-hidden">
          <div className="py-2 max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                    isSelected 
                      ? 'bg-[#F4F9F4] text-[#1A1A1A] font-bold' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#5FC36C]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}