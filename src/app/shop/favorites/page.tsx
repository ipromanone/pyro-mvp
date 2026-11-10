'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer'; // <--- ДОБАВЛЕН ИМПОРТ
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [clientOrg, setClientOrg] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      if (clientData && clientData.length > 0) setClientOrg(clientData[0]);

      const savedFav = localStorage.getItem('pyro_favorites');
      const favIds = savedFav ? JSON.parse(savedFav) : [];
      setFavorites(favIds);

      if (favIds.length > 0) {
        const { data } = await supabase.from('products').select('*').in('id', favIds);
        setProducts(data || []);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const removeFav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const newFavs = favorites.filter(f => f !== id);
    setFavorites(newFavs);
    localStorage.setItem('pyro_favorites', JSON.stringify(newFavs));
    setProducts(products.filter(p => p.id !== id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      <ShopHeader cartCount={0} favoritesCount={favorites.length} clientName={clientOrg?.name || 'Профиль'} />
      
      <div className="flex-grow max-w-[1400px] mx-auto px-6 mt-8 pb-20 w-full">
        <h1 className="text-3xl font-black mb-8">Избранное</h1>
        
        {products.length === 0 ? (
          <div className="bg-white p-12 rounded-[1.5rem] text-center shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium text-lg">В избранном пока пусто</p>
            <Link href="/shop" className="inline-block mt-4 text-[#5FC36C] font-bold hover:underline">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <Link href={`/product/${product.id}`} key={product.id} className="bg-white rounded-[1.5rem] p-3 hover:shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-300 relative border border-gray-100 group flex flex-col">
                <button onClick={(e) => removeFav(e, product.id)} className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white shadow-sm text-[#FF8A8A]">
                   <Heart className="w-5 h-5" fill="currentColor" strokeWidth={2.5} />
                </button>
                <div className="relative aspect-[3/4] bg-[#F3F4F6] rounded-[1rem] overflow-hidden mb-4">
                  {product.image_url ? (
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">Нет фото</div>
                  )}
                </div>
                <div className="px-1 flex flex-col flex-grow">
                  <div className="text-xl font-black text-black mb-1">{product.price} ₽</div>
                  <h2 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">{product.name}</h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      
    </div>
  );
}
