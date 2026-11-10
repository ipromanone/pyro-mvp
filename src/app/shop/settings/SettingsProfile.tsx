'use client';

import { useState } from 'react';
import { supabase } from '../../supabase';
import { Pencil } from 'lucide-react';

export default function SettingsProfile({ clientOrg, setToast }: { clientOrg: any, setToast: any }) {
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState(clientOrg?.contact_phone || '');

  const handleSavePhone = async () => {
    if (!clientOrg) return;
    const { error } = await supabase.from('organizations').update({ contact_phone: phone }).eq('id', clientOrg.id);
    if (error) {
      setToast({ message: 'Ошибка сохранения', type: 'error' });
    } else {
      setToast({ message: 'Телефон обновлен', type: 'success' });
      setIsEditingPhone(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-black mb-6">Мои данные</h2>

      <div className="space-y-6 max-w-md">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Номер телефона</p>
            {isEditingPhone ? (
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-[#5FC36C]" />
            ) : (
              <p className="font-bold">{clientOrg?.contact_phone || 'Не заполнен'}</p>
            )}
          </div>
          {isEditingPhone ? (
            <button onClick={handleSavePhone} className="text-sm font-bold text-[#5FC36C] hover:underline">Сохранить</button>
          ) : (
            <button onClick={() => setIsEditingPhone(true)} className="p-2 bg-white rounded-lg shadow-sm hover:text-[#5FC36C]"><Pencil className="w-4 h-4" /></button>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Почта</p>
            <p className="font-bold">bz.ipromanone@yandex.ru</p>
          </div>
        </div>
      </div>
    </div>
  );
}