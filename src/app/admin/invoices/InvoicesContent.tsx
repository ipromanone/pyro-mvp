'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminInvoices() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const markAsPaid = async (id: string) => {
    await supabase.from('invoices').update({ status: 'Оплачен' }).eq('id', id);
    fetchInvoices();
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'pending') return inv.status === 'Ожидает оплаты';
    if (filter === 'paid') return inv.status === 'Оплачен';
    return true;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F4F9F4] text-[#4CAF50]">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-[#F4F9F4] text-[#1A3A2A] font-sans pb-20">
      <header className="bg-white border-b border-[#E3F2E3] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-sm font-bold bg-[#F4F9F4] px-5 py-2 rounded-full hover:bg-[#E3F2E3]">← В админку</Link>
          <span className="text-xl font-extrabold text-[#4CAF50]">Счета клиентов</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'all' ? 'bg-[#5FC36C] text-white' : 'bg-white text-gray-500'}`}>Все счета</button>
          <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'pending' ? 'bg-[#5FC36C] text-white' : 'bg-white text-gray-500'}`}>Ждут оплаты</button>
          <button onClick={() => setFilter('paid')} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter === 'paid' ? 'bg-[#5FC36C] text-white' : 'bg-white text-gray-500'}`}>Оплаченные</button>
        </div>

        <div className="bg-white rounded-[2rem] border border-[#E3F2E3] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FBF8] border-b border-[#E3F2E3]">
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Счет №</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Дата</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Сумма</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Статус</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#F8FBF8]">
                  <td className="px-6 py-4 font-bold text-sm">{inv.invoice_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.created_at).toLocaleDateString('ru-RU')}</td>
                  <td className="px-6 py-4 font-extrabold">{inv.amount} ₽</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${inv.status === 'Ожидает оплаты' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === 'Ожидает оплаты' && (
                      <button onClick={() => markAsPaid(inv.id)} className="text-xs font-bold bg-[#E3F2E3] text-[#1A3A2A] px-3 py-2 rounded-lg hover:bg-[#d0ebd0]">
                        Отметить оплаченным
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-bold">Счетов пока нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}