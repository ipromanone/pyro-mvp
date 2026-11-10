'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import Toast from '../../../components/Toast';

export default function StoreContent() { // <--- ГЛАВНОЕ: export default
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (!error && data && isMounted) setProducts(data);
      if (isMounted) setLoading(false);
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-[#F4F9F4] font-sans text-[#1A1A1A] pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <header className="bg-white border-b border-[#E3F2E3] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[#4CAF50]">Витрина (Товары)</h1>
          <div className="flex gap-4 items-center">
            <Link href="/admin/my-orgs" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Мои организации</Link>
            <Link href="/admin/clients" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Клиенты</Link>
            <Link href="/admin" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Заказы</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Название</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Цена</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500">Остаток</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 font-bold">{p.price} ₽</td>
                  <td className="px-6 py-4">{p.stock} шт.</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={3} className="p-12 text-center text-gray-500">Товаров пока нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}