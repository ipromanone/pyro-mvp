'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import Toast from '../../../components/Toast';
import { Search, User, Phone, FileText } from 'lucide-react';

export default function ClientsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      // Загружаем всех клиентов из organizations
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && isMounted) {
        setClients(data);
      }
      if (isMounted) setLoading(false);
    }

    loadClients();

    return () => { isMounted = false; };
  }, []);

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.inn?.includes(search) ||
    c.contact_phone?.includes(search)
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-[#F4F9F4] font-sans text-[#1A1A1A] pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white border-b border-[#E3F2E3] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[#4CAF50]">Клиенты</h1>
          <div className="flex gap-4 items-center">
            <Link href="/admin/my-orgs" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Мои организации</Link>
            <Link href="/admin" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Заказы</Link>
            <Link href="/admin/clients" className="text-sm font-bold bg-[#5FC36C] text-white px-4 py-2 rounded-xl shadow-sm">Клиенты</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        {/* Поиск */}
        <div className="bg-white rounded-[1.5rem] p-4 mb-6 border border-gray-100 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Поиск по названию, ИНН или телефону..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none font-medium text-sm"
          />
        </div>

        {/* Список клиентов */}
        <div className="space-y-4">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-[#5FC36C]" />
                  <h3 className="font-black text-lg">{client.name || 'Без названия'}</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-x-6 gap-y-1 text-sm text-gray-600">
                  <p className="flex items-center gap-1"><FileText className="w-4 h-4 text-gray-400" /> ИНН: {client.inn || '—'}</p>
                  <p className="flex items-center gap-1"><Phone className="w-4 h-4 text-gray-400" /> {client.contact_phone || '—'}</p>
                </div>
              </div>
              <Link 
                href={`/admin/clients/${client.id}`} 
                className="text-[#5FC36C] font-bold hover:text-[#4CAF50] bg-[#E3F2E3] px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                Подробнее
              </Link>
            </div>
          ))}
          {filteredClients.length === 0 && !loading && (
            <div className="bg-white p-12 rounded-[1.5rem] text-center text-gray-500 font-medium">
              Клиенты не найдены
            </div>
          )}
        </div>
      </main>
    </div>
  );
}