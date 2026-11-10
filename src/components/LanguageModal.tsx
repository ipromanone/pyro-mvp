'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageModal({ onClose }: { onClose: () => void }) {
  const { lang, setLang, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(lang);
  const [selectedCurrency, setSelectedCurrency] = useState('RUB');

  const handleSave = () => {
    setLang(selectedLang);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-black mb-2">{t('lang_currency')}</h2>
        <p className="text-sm text-gray-500 font-medium mb-8">
          {t('currency_note')}
        </p>

        <div className="space-y-6">
          {/* Выбор языка */}
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">{t('language')}</label>
            <select 
              value={selectedLang} 
              onChange={(e) => setSelectedLang(e.target.value as any)}
              className="w-full bg-[#F3F4F6] border-2 border-transparent rounded-xl p-4 font-medium focus:border-[#5FC36C] focus:bg-white outline-none cursor-pointer"
            >
              <option value="ru">🇷🇺 Русский</option>
              <option value="en">🇬🇧 English</option>
              <option value="zh">🇨🇳 中文 (Chinese)</option>
            </select>
          </div>

          {/* Выбор валюты (только RUB, так как расчеты в РФ) */}
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">{t('currency')}</label>
            <select 
              value={selectedCurrency} 
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full bg-[#F3F4F6] border-2 border-transparent rounded-xl p-4 font-medium focus:border-[#5FC36C] focus:bg-white outline-none cursor-pointer"
            >
              <option value="RUB">🇷🇺 Российский рубль, RUB</option>
              <option value="USD" disabled>🇺🇸 Доллар США, USD (в разработке)</option>
              <option value="CNY" disabled>🇨🇳 Юань, CNY (в разработке)</option>
            </select>
            <p className="text-xs text-gray-400 mt-2 font-medium">
              * Юридические расчеты производятся только в рублях.
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-8 bg-[#5FC36C] text-white py-4 rounded-xl font-black hover:bg-[#4CAF50] transition-colors"
        >
          {t('save')}
        </button>
      </div>
    </div>
  );
}