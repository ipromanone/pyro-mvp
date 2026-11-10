'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function BankInput({ value, onChange, onDataLoaded }: { 
  value: string, 
  onChange: (val: string) => void, 
  onDataLoaded: (data: any) => void 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const cleanBik = value.replace(/\D/g, '');
    
    if (cleanBik.length !== 9) {
      setError('БИК должен содержать 9 цифр');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Token 70f1eefc26057ffd266c229b45ff927301d5d6ff' // ВАШ КЛЮЧ
        },
        body: JSON.stringify({ query: cleanBik })
      });

      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        const bank = data.suggestions[0].data;
        onDataLoaded({
          bank_name: bank.name?.payment || bank.name?.short || '',
          bik: bank.bik || '',
          corr_account: bank.correspondent_account || ''
        });
      } else {
        setError('Банк не найден');
      }
    } catch (err) {
      setError('Ошибка запроса. Проверьте ключ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">БИК</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          placeholder="Введите БИК"
          maxLength={9}
          className="flex-grow bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#5FC36C] text-white px-4 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Найти
        </button>
      </div>
      {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
    </div>
  );
}