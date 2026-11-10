'use client';

import { useState } from 'react';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

export default function EmailInput({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isFocused, setIsFocused] = useState(false);
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const showError = !isValid && value.length > 0 && !isFocused;

  return (
    <div className="relative">
      <div className={`flex items-center w-full bg-gray-50 border rounded-xl overflow-hidden transition-all ${
        showError ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-500' : 'border-gray-200 focus-within:ring-2 focus-within:ring-[#5FC36C]'
      }`}>
        <div className="pl-4 text-gray-400"><Mail className="w-5 h-5" /></div>
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="example@company.ru"
          className="w-full bg-transparent px-4 py-3 font-medium focus:outline-none placeholder:text-gray-400"
        />
        {value.length > 0 && (
          <div className="pr-4">
            {isValid ? <CheckCircle className="w-5 h-5 text-[#5FC36C]" /> : !isFocused && <XCircle className="w-5 h-5 text-red-500" />}
          </div>
        )}
      </div>
      {showError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">Введите корректный email</p>}
    </div>
  );
}