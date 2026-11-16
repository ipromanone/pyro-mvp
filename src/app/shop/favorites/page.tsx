'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      // 1. Получаем данные организации для шапки
      const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      if (clientData && clientData.length > 0) setClientOrg(clientData[0]);

      // 2. Получаем избранное из БАЗЫ ДАННЫХ (а не из localStorage)
      const { data: favData } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
      
      if (favData && favData.length > 0) {
        const favIds = favData.map(f => f.product_id);
        setFavorites(favIds);

        // 3. Загружаем товары, которые в избранном
        const { data: prodData } = await supabase.from('products').select('*').in('id', favIds);
        if (prodData) setProducts(prodData);
      }

      // 4. Получаем счетчик корзины для шапки
      const { data: cartData } = await supabase.from('cart_items').select('quantity').eq('user_id', session.user.id);
      if (cartData) setCartCount(cartData.reduce((sum, item) => sum + item.quantity, 0));

      setLoading(false);
    }
    init();
  }, [router]);

  const removeFav = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Удаляем из базы данных
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('product_id', id);
    }

    // Обновляем UI
    const newFavs = favorites.filter(f => f !== id);
    setFavorites(newFavs);
    setProducts(products.filter(p => p.id !== id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB] dark:bg-gray-900 dark:text-white">Загрузка...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-gray-900 text-[#1A1A1A] dark:text-white font-sans transition-colors duration-300">
      <ShopHeader cartCount={cartCount} favoritesCount={favorites.length} clientName={clientOrg?.name || 'Профиль'} />
      
      <div className="flex-grow max-w-[1400px] mx-auto px-6 mt-8 pb-20 w-full">
        <h1 className="text-3xl font-black mb-8">Избранное</h1>
        
        {products.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-[1.5rem] text-center shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">В избранном пока пусто</p>
            <Link href="/shop" className="inline-block mt-4 text-[#5FC36C] font-bold hover:underline">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <Link href={`/product/${product.id}`} key={product.id} className="bg-white dark:bg-gray-800 rounded-[1.5rem] p-3 hover:shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-300 relative border border-gray-100 dark:border-gray-700 group flex flex-col">
                <button 
                  onClick={(e) => removeFav(e, product.id)} 
                  className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm text-[#FF8A8A]"
                >
                   <Heart className="w-5 h-5" fill="currentColor" strokeWidth={2.5} />
                </button>
                <div className="relative aspect-[3/4] bg-[#F3F4F6] dark:bg-gray-700/50 rounded-[1rem] overflow-hidden mb-4">
                  {product.image_url ? (
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">Нет фото</div>
                  )}
                </div>
                <div className="px-1 flex flex-col flex-grow">
                  <div className="text-xl font-black text-black dark:text-white mb-1">{product.price} ₽</div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">{product.name}</h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}