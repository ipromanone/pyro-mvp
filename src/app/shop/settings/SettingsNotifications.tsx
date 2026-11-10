'use client';

import { useState } from 'react';

export default function SettingsNotifications() {
  const [notifyInvoices, setNotifyInvoices] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState(true);
  const [notifyPromo, setNotifyPromo] = useState(false);
  const [notifyDocs, setNotifyDocs] = useState(true);

  const Toggle = ({ checked, onChange, label, desc }: any) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div>
        <p className="font-bold text-sm text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#5FC36C]' : 'bg-gray-300'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-black mb-2">Уведомления</h2>
      <p className="text-sm text-gray-500 font-medium mb-6">Настройте, какие события вы хотите получать на почту и в колокольчик.</p>

      <div className="space-y-4 max-w-2xl">
        <Toggle checked={notifyInvoices} onChange={setNotifyInvoices} label="Счета и документы" desc="Уведомлять при формировании нового счета или закрывающих документов" />
        <Toggle checked={notifyStatus} onChange={setNotifyStatus} label="Статусы заказов" desc="Уведомлять при изменении статуса заказа (в работе, отправлен)" />
        <Toggle checked={notifyDocs} onChange={setNotifyDocs} label="Ответы поддержки" desc="Уведомлять, когда менеджер отвечает на ваш запрос" />
        <Toggle checked={notifyPromo} onChange={setNotifyPromo} label="Акции и новости" desc="Информировать о новых поступлениях и сезонных распродажах" />
      </div>
    </div>
  );
}