'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function InnInput({ value, onChange, onDataLoaded }: { 
  value: string, 
  onChange: (val: string) => void, 
  onDataLoaded: (data: any) => void 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const cleanInn = value.replace(/\D/g, '');
    
    if (cleanInn.length !== 10 && cleanInn.length !== 12) {
      setError('ИНН должен содержать 10 или 12 цифр');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Получаем данные по ИНН (Организация)
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Token 70f1eefc26057ffd266c229b45ff927301d5d6ff' // <--- ВАШ НОВЫЙ КЛЮЧ
        },
        body: JSON.stringify({ query: cleanInn })
      });

      const data = await response.json();

      if (!data.suggestions || data.suggestions.length === 0) {
        setError('Организация не найдена');
        setLoading(false);
        return;
      }

      const org = data.suggestions[0].data;
      const name = org.name?.short_with_opf || org.name?.full_with_opf || '';
      const address = org.address?.value || '';
      const kpp = org.kpp || '';
      const ogrn = org.ogrn || '';
      
      // Базовые данные (пока без банка)
      let resultData: any = {
        name, inn: cleanInn, kpp, ogrn, address,
        bank_name: '', bik: '', account: '', corr_account: ''
      };

      // 2. Если у организации есть БИК, запрашиваем банк
      if (org.bank?.bic) {
        try {
          const bankResponse = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': 'Token 70f1eefc26057ffd266c229b45ff927301d5d6ff' // <--- ВАШ НОВЫЙ КЛЮЧ
            },
            body: JSON.stringify({ query: org.bank.bic })
          });

          const bankData = await bankResponse.json();
          
          if (bankData.suggestions && bankData.suggestions.length > 0) {
            const bank = bankData.suggestions[0].data;
            resultData.bank_name = bank.name?.payment || bank.name?.short || '';
            resultData.bik = bank.bic || '';
            resultData.account = bank.account || '';
            resultData.corr_account = bank.correspondent_account || '';
          }
        } catch (bankErr) {
          console.error('Ошибка загрузки банка:', bankErr);
        }
      }

      onDataLoaded(resultData);
    } catch (err) {
      setError('Ошибка запроса. Проверьте ключ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">ИНН *</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          placeholder="Введите ИНН"
          maxLength={12}
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