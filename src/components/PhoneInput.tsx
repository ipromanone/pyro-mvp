'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const countries = [
  { code: '+7', iso: 'RU', flag: '🇷🇺', mask: '(999) 999-99-99', name: 'Россия' },
  { code: '+375', iso: 'BY', flag: '🇧🇾', mask: '(99) 999-99-99', name: 'Беларусь' },
  { code: '+7', iso: 'KZ', flag: '🇰🇿', mask: '(999) 999-99-99', name: 'Казахстан' },
  { code: '+998', iso: 'UZ', flag: '🇺🇿', mask: '(99) 999-99-99', name: 'Узбекистан' },
  { code: '+374', iso: 'AM', flag: '🇦🇲', mask: '(99) 999-999', name: 'Армения' },
];

export default function PhoneInput({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [phoneBody, setPhoneBody] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Парсинг входящего значения
  useEffect(() => {
    if (value) {
      const cleanValue = value.replace(/\D/g, '');
      const country = countries.find(c => cleanValue.startsWith(c.code.replace('+', ''))) || countries[0];
      setSelectedCountry(country);
      setPhoneBody(cleanValue.substring(country.code.replace('+', '').length));
    }
  }, []);

  const formatPhone = (val: string, mask: string) => {
    let result = '';
    let valIndex = 0;
    for (let i = 0; i < mask.length; i++) {
      if (valIndex >= val.length) break;
      if (mask[i] === '9') {
        result += val[valIndex];
        valIndex++;
      } else {
        result += mask[i];
      }
    }
    return result;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setPhoneBody(rawValue);
    onChange(`${selectedCountry.code} ${formatPhone(rawValue, selectedCountry.mask)}`.trim());
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setIsOpen(false);
    // Пересчитываем номер при смене страны
    onChange(`${country.code} ${formatPhone(phoneBody, country.mask)}`.trim());
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex w-full bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-[#5FC36C] transition-all">
        
        {/* Кнопка выбора страны */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border-r border-gray-200 transition-colors shrink-0"
        >
          <span className="text-xl leading-none">{selectedCountry.flag}</span>
          <span className="font-bold text-gray-900">{selectedCountry.code}</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Поле ввода номера */}
        <input
          type="tel"
          value={formatPhone(phoneBody, selectedCountry.mask)}
          onChange={handlePhoneChange}
          placeholder={placeholder || selectedCountry.mask.replace(/9/g, '0')}
          className="flex-grow bg-transparent px-4 py-3 font-medium focus:outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Выпадающий список стран (поверх всего) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl z-[999] max-h-60 overflow-y-auto py-1">
          {countries.map((c) => (
            <button
              key={c.iso}
              type="button"
              onClick={() => handleCountrySelect(c)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F9F4] text-left transition-colors"
            >
              <span className="text-xl">{c.flag}</span>
              <span className="font-bold text-sm text-gray-900">{c.name}</span>
              <span className="ml-auto text-gray-500 text-sm font-medium">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}