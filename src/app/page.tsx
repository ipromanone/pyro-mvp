'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);

    if (email === 'admin' && password === 'admin') {
      localStorage.setItem('userRole', 'admin');
      router.push('/admin');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message);
    } else {
      localStorage.setItem('userRole', 'client');
      router.push('/shop');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);

    const { error } = await supabase.auth.signUp({ 
      email, password, options: { data: { name, phone } }
    });

    if (error) setError(error.message);
    else {
      setMessage('Регистрация успешна! Теперь вы можете войти.');
      setMode('login');
      setPassword('');
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage('Ссылка для сброса пароля отправлена на вашу почту.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F9F4] text-[#1A3A2A] font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Декоративные круги на фоне */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E3F2E3] rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E3F2E3] rounded-full blur-3xl opacity-60"></div>

      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,100,50,0.1)] w-full max-w-md relative z-10 border border-[#E3F2E3]">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#4CAF50] tracking-tight mb-2">Pyro.</h1>
          <p className="text-gray-500 font-medium">
            {mode === 'login' && 'Вход в личный кабинет'}
            {mode === 'register' && 'Создание аккаунта'}
            {mode === 'reset' && 'Восстановление пароля'}
          </p>
        </div>

        {message && <div className="bg-[#E3F2E3] text-[#1A3A2A] font-medium p-3 rounded-xl text-center mb-6">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 font-medium p-3 rounded-xl text-center mb-6">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-2xl p-4 font-medium focus:outline-none focus:border-[#4CAF50] transition-colors placeholder-gray-400" placeholder="Email или логин" required />
            </div>
            <div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-2xl p-4 font-medium focus:outline-none focus:border-[#4CAF50] transition-colors placeholder-gray-400" placeholder="Пароль" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5FC36C] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4CAF50] shadow-[0_4px_15px_rgba(95,195,108,0.3)] transition-all disabled:opacity-50">
              {loading ? 'Загрузка...' : 'Войти'}
            </button>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F0F0F0]">
              <button type="button" onClick={() => { setMode('reset'); setError(''); setMessage(''); }} className="text-sm font-medium text-gray-400 hover:text-[#4CAF50]">
                Забыли пароль?
              </button>
              <button type="button" onClick={() => { setMode('register'); setError(''); setMessage(''); }} className="text-sm font-bold text-[#4CAF50] hover:underline">
                Зарегистрироваться
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-2xl p-4 font-medium focus:outline-none focus:border-[#4CAF50] transition-colors placeholder-gray-400" placeholder="Имя / Компания" required />
            </div>
            <div>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-2xl p-4 font-medium focus:outline-none focus:border-[#4CAF50] transition-colors placeholder-gray-400" placeholder="Телефон" required />
            </div>
            <div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-2xl p-4 font-medium focus:outline-none focus:border-[#4CAF50] transition-colors placeholder-gray-400" placeholder="Email" required />
            </div>
            <div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-2xl p-4 font-medium focus:outline-none focus:border-[#4CAF50] transition-colors placeholder-gray-400" placeholder="Пароль (мин. 6 символов)" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5FC36C] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4CAF50] shadow-[0_4px_15px_rgba(95,195,108,0.3)] transition-all disabled:opacity-50 mt-2">
              {loading ? 'Загрузка...' : 'Создать аккаунт'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-sm font-medium text-gray-400 hover:text-[#4CAF50]">
                &larr; Вернуться ко входу
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-2xl p-4 font-medium focus:outline-none focus:border-[#4CAF50] transition-colors placeholder-gray-400" placeholder="Ваш Email" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5FC36C] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4CAF50] shadow-[0_4px_15px_rgba(95,195,108,0.3)] transition-all disabled:opacity-50">
              {loading ? 'Отправка...' : 'Сбросить пароль'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-sm font-medium text-gray-400 hover:text-[#4CAF50]">
                &larr; Вернуться ко входу
              </button>
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