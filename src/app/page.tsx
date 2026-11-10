'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import EmailInput from '../components/EmailInput';
import PhoneInput from '../components/PhoneInput';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+7');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ВХОД ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);

    if (email === 'admin' && password === 'admin') {
      localStorage.setItem('userRole', 'admin');
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message);
    } else if (data.user) {
      // ПРОВЕРКА: Если организации нет, создаем её на лету
      const { data: orgData } = await supabase.from('organizations').select('id').eq('user_id', data.user.id).limit(1);
      
      if (!orgData || orgData.length === 0) {
        // Создаем запись, если ее нет (например, старый пользователь)
        await supabase.from('organizations').insert([{
          user_id: data.user.id,
          name: data.user.email?.split('@')[0] || 'Новая организация',
          email: data.user.email
        }]);
      }
      
      localStorage.setItem('userRole', 'client');
      router.push('/shop');
    }
    setLoading(false);
  };

  // --- РЕГИСТРАЦИЯ ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email'); setLoading(false); return;
    }
    if (phone.length < 10) {
      setError('Введите корректный номер телефона'); setLoading(false); return;
    }

    // 1. Создаем пользователя
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, password, options: { data: { name, phone } }
    });

    if (authError) {
      setError(authError.message);
    } else if (authData.user) {
      // 2. Создаем организацию в базе
      const { error: orgError } = await supabase.from('organizations').insert([{
        user_id: authData.user.id,
        name: name || email.split('@')[0],
        contact_phone: phone,
        email: email
      }]);

      if (orgError) {
        setError('Ошибка создания профиля: ' + orgError.message);
      } else {
        setMessage('Регистрация успешна! Теперь вы можете войти.');
        setMode('login');
        setPassword('');
      }
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage('Ссылка для сброса пароля отправлена на почту.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F9F4] text-[#1A3A2A] font-sans flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl w-full max-w-md border border-[#E3F2E3]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#4CAF50] tracking-tight mb-2">Pyro.</h1>
          <p className="text-gray-500 font-medium">
            {mode === 'login' ? 'Вход в личный кабинет' : mode === 'register' ? 'Создание аккаунта' : 'Восстановление пароля'}
          </p>
        </div>

        {message && <div className="bg-[#E3F2E3] text-[#1A3A2A] font-medium p-3 rounded-xl text-center mb-6">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 font-medium p-3 rounded-xl text-center mb-6">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email или логин</label>
              {email === 'admin' ? (
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 font-medium focus:border-[#4CAF50] outline-none" placeholder="Email или логин" required />
              ) : (
                <EmailInput value={email} onChange={setEmail} />
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Пароль</label>
              <div className="flex items-center w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl overflow-hidden focus-within:border-[#4CAF50]">
                <div className="pl-4 text-gray-400"><Lock className="w-5 h-5" /></div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent px-4 py-3 font-medium focus:outline-none" placeholder="Пароль" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5FC36C] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4CAF50] shadow-lg disabled:opacity-50">
              {loading ? 'Загрузка...' : 'Войти'}
            </button>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F0F0F0]">
              <button type="button" onClick={() => { setMode('reset'); setError(''); setMessage(''); }} className="text-sm font-medium text-gray-400 hover:text-[#4CAF50]">Забыли пароль?</button>
              <button type="button" onClick={() => { setMode('register'); setError(''); setMessage(''); }} className="text-sm font-bold text-[#4CAF50] hover:underline">Зарегистрироваться</button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Название компании / ФИО</label>
              <div className="flex items-center w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl overflow-hidden focus-within:border-[#4CAF50]">
                <div className="pl-4 text-gray-400"><User className="w-5 h-5" /></div>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent px-4 py-3 font-medium focus:outline-none" placeholder="ИП Иванов" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Телефон</label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <EmailInput value={email} onChange={setEmail} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Пароль (мин. 6 символов)</label>
              <div className="flex items-center w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl overflow-hidden focus-within:border-[#4CAF50]">
                <div className="pl-4 text-gray-400"><Lock className="w-5 h-5" /></div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent px-4 py-3 font-medium focus:outline-none" placeholder="Пароль" required minLength={6} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5FC36C] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4CAF50] shadow-lg disabled:opacity-50 mt-2">
              {loading ? 'Загрузка...' : 'Создать аккаунт'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-sm font-medium text-gray-400 hover:text-[#4CAF50]">← Вернуться ко входу</button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Ваш Email</label>
              <EmailInput value={email} onChange={setEmail} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5FC36C] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4CAF50] shadow-lg disabled:opacity-50">
              {loading ? 'Отправка...' : 'Сбросить пароль'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-sm font-medium text-gray-400 hover:text-[#4CAF50]">← Вернуться ко входу</button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-gray-400">Вход для админа: admin / admin</p>
        </div>
      </div>
    </div>
  );
}