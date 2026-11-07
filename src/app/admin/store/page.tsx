'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';

export default function AdminStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');
  
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (!error) setProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    return true;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold bg-[#F7F4EF] text-black">Загрузка...</div>;

  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-black font-sans pb-20">
      <header className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black uppercase tracking-tighter">Pyro. Admin View</h1>
            <div className="flex gap-2">
               <Link href="/admin" className="text-sm font-bold bg-[#F7F4EF] border-2 border-black px-4 py-1 rounded-lg hover:bg-gray-200">Заказы</Link>
               <Link href="/admin/store" className="text-sm font-bold bg-[#EB5534] text-white border-2 border-black px-4 py-1 rounded-lg shadow-[2px_2px_0px_#000]">Витрина</Link>
            </div>
          </div>
          
          <button onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/'; }} className="text-sm font-bold bg-white border-2 border-black px-4 py-1 rounded-lg hover:bg-gray-100">Выйти</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-8 mt-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-5 rounded-3xl border-4 border-black shadow-[6px_6px_0px_#000]">
            <h3 className="text-xl font-black uppercase mb-4">Фильтры</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Категория</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                  <option value="">Все</option>
                  <option value="Салют">Салют</option>
                  <option value="Хлопушка">Хлопушка</option>
                  <option value="Бенгальский огонь">Бенгальский огонь</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Бренд</label>
                <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                  <option value="">Все</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl p-4 border-4 border-black shadow-[6px_6px_0px_#000] flex flex-col">
                <div className="mb-4 rounded-xl overflow-hidden border-4 border-black bg-gray-100 relative h-40">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-sm">Нет фото</div>
                  )}
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{product.brand} • {product.category}</span>
                  <h2 className="text-lg font-black leading-tight uppercase line-clamp-2">{product.name}</h2>
                </div>
                <div className="mt-2 pt-3 border-t-2 border-black flex items-center justify-between">
                  <span className="text-xl font-black">{product.price} ₽</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-black rounded-md ${product.stock > 0 ? 'bg-[#4A9EDE] text-white' : 'bg-[#F2A5A5] text-black'}`}>
                    {product.stock > 0 ? `Остаток: ${product.stock}` : 'Нет'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}