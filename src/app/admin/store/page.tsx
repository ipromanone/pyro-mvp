'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import Toast from '../../../components/Toast';
import { ArrowLeft, Plus, Upload, Search, FileText, Edit, Trash2 } from 'lucide-react';

export default function StoreContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [search, setSearch] = useState('');

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

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка склада...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#1A1A1A] pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* ШАПКА */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black bg-gray-100 px-4 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Назад в админку
            </Link>
            <h1 className="text-2xl font-black text-gray-900">Склад (Товары)</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/admin/settings" className="text-sm font-bold bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Мои организации
            </Link>
            <Link href="/admin/clients" className="text-sm font-bold bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Клиенты
            </Link>
            <Link href="/admin" className="text-sm font-bold bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Заказы
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 mt-8">
        
        {/* ПАНЕЛЬ ДЕЙСТВИЙ И ПОИСК */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-[#5FC36C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#4CAF50] shadow-sm shadow-green-500/20 transition-colors">
              <Plus className="w-5 h-5" /> Добавить товар
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 shadow-sm transition-colors">
              <Upload className="w-5 h-5" /> Загрузить прайс (Excel/CSV)
            </button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Поиск по названию или категории..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 font-medium focus:outline-none focus:border-[#5FC36C] focus:ring-1 focus:ring-[#5FC36C] transition-all"
            />
          </div>
        </div>

        {/* ТАБЛИЦА ТОВАРОВ */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Товар</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Категория</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Цена</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Остаток</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Источник</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.brand || 'Без бренда'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{p.category || '—'}</td>
                    <td className="px-6 py-4 font-black text-gray-900">{p.price} ₽</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-md text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {p.stock} шт.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{p.source || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-[#5FC36C] hover:bg-green-50 rounded-lg transition-colors" title="Редактировать">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-lg font-bold text-gray-900">Товары не найдены</p>
                        <p className="text-gray-500">Попробуйте изменить запрос или добавьте новый товар.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}