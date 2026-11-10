'use client';

import { useState } from 'react';
import { supabase } from '../../supabase';
import { ShieldCheck } from 'lucide-react';

export default function SettingsSecurity({ setToast }: { setToast: any }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (password !== confirm) {
      setToast({ message: 'Пароли не совпадают', type: 'error' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setToast({ message: 'Ошибка: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Пароль изменен', type: 'success' });
      setPassword('');
      setConfirm('');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-black mb-6">Безопасность</h2>

      <div className="bg-[#E3F2E3] p-6 rounded-2xl flex items-start gap-4 mb-8">
        <ShieldCheck className="w-8 h-8 text-[#5FC36C] shrink-0" />
        <div>
          <h3 className="font-bold text-lg mb-1">Защитите свой аккаунт</h3>
          <p className="text-sm text-gray-600 font-medium">Рекомендуем регулярно менять пароль и не использовать один и тот же пароль на разных сайтах.</p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Новый пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Повторите пароль</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
        </div>
        <button onClick={handleChangePassword} disabled={loading} className="w-full bg-[#5FC36C] text-white py-4 rounded-xl font-black hover:bg-[#4CAF50] transition-colors disabled:opacity-50 mt-2">
          {loading ? 'Сохранение...' : 'Изменить пароль'}
        </button>
      </div>
    </div>
  );
}