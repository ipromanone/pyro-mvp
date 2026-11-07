'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login === 'admin' && password === 'admin') {
      localStorage.setItem('userRole', 'admin');
      router.push('/admin');
    } else if (login === 'client' && password === '123') {
      localStorage.setItem('userRole', 'client');
      router.push('/shop');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-black font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 opacity-80 pointer-events-none hidden md:block">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 0C50 27.6142 27.6142 50 0 50C27.6142 50 50 72.3858 50 100C50 72.3858 72.3858 50 100 50C72.3858 50 50 27.6142 50 0Z" fill="#4A9EDE"/></svg>
      </div>
      <div className="absolute bottom-20 right-20 opacity-80 pointer-events-none hidden md:block">
         <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 0C50 27.6142 27.6142 50 0 50C27.6142 50 50 72.3858 50 100C50 72.3858 72.3858 50 100 50C72.3858 50 50 27.6142 50 0Z" fill="#EB5534"/></svg>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-3xl border-4 border-black shadow-[8px_8px_0px_#000] w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Pyro.</h1>
          <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">Оптовые поставки</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-black uppercase tracking-wide mb-2">Логин</label>
            <input type="text" value={login} onChange={e => setLogin(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-4 font-bold focus:outline-none focus:bg-white transition-colors" placeholder="Введите логин" required />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wide mb-2">Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-4 font-bold focus:outline-none focus:bg-white transition-colors" placeholder="••••••" required />
          </div>

          {error && <div className="bg-red-100 text-red-600 font-bold p-3 rounded-lg text-center border-2 border-red-600">{error}</div>}

          <button type="submit" className="w-full bg-[#4A9EDE] text-white py-4 rounded-xl font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all">Войти</button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase">Клиент: client / 123 <br/>Админ: admin / admin</p>
        </div>
      </div>
    </div>
  );
}