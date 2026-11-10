'use client';

import { useState } from 'react';
import { ChevronRight, X, UserCircle, ShoppingBag, FileText, Check } from 'lucide-react';

export default function Onboarding({ onComplete, onGoToSettings }: { onComplete: () => void, onGoToSettings: () => void }) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: 'Добро пожаловать в Pyro!',
      desc: 'Мы — ваш надежный B2B-партнер по оптовым закупкам пиротехники. Сейчас я покажу вам, как здесь всё устроено.',
      icon: <UserCircle className="w-12 h-12 text-[#5FC36C]" />,
      btn: 'Поехали!',
      action: () => setStep(2)
    },
    {
      title: 'Ваш Каталог и Корзина',
      desc: 'Выбирайте товары, смотрите актуальные остатки. Всё в пару кликов. Забудьте про Excel и звонки менеджерам.',
      icon: <ShoppingBag className="w-12 h-12 text-[#5FC36C]" />,
      btn: 'Понятно',
      action: () => setStep(3)
    },
    {
      title: 'Реквизиты и Документы',
      desc: 'Для оформления счетов нам нужны ваши реквизиты. Заполнить их сейчас? Это займет 2 минуты.',
      icon: <FileText className="w-12 h-12 text-[#5FC36C]" />,
      btn: 'Заполнить сейчас',
      action: onGoToSettings
    }
  ];

  const current = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 md:p-12 max-w-lg w-full shadow-2xl relative overflow-hidden">
        
        <button 
          onClick={onComplete} 
          className="absolute top-6 right-6 flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
        >
          <span className="hidden md:inline">Я уже всё знаю</span>
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-grow rounded-full ${i <= step ? 'bg-[#5FC36C]' : 'bg-gray-100'}`}></div>
          ))}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
            {current.icon}
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">{current.title}</h2>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">{current.desc}</p>
          
          <button 
            onClick={current.action} 
            className="w-full bg-[#5FC36C] text-white py-4 rounded-xl font-black text-lg hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
            {current.btn} <ChevronRight className="w-5 h-5" />
          </button>
          
          {step === 3 && (
            <button onClick={onComplete} className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2">
              <Check className="w-4 h-4" /> Сделаю это позже
            </button>
          )}
        </div>
      </div>
    </div>
  );
}