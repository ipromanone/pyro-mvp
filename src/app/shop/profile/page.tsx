'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import { User, Phone, FileText, LogOut, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }

      // Получаем организацию
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();

      if (orgData) setOrg(orgData);

      // Счетчики для шапки
      const { data: cartData } = await supabase.from('cart_items').select('quantity').eq('user_id', session.user.id);
      if (cartData) setCartCount(cartData.reduce((sum, item) => sum + item.quantity, 0));

      const { data: favData } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
      if (favData) setFavoritesCount(favData.length);

      setLoading(false);
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 text-[#1A1A1A] dark:text-white font-sans flex flex-col transition-colors duration-300">
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={org?.name || 'Клиент'} />

      <main className="flex-grow max-w-2xl mx-auto px-6 py-12 w-full">
        
        {/* Карточка профиля */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors">
          
          {/* Аватар */}
          <div className="w-24 h-24 bg-[#5FC36C] rounded-full mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 shadow-lg shadow-green-500/20">
            {org?.name ? org.name.charAt(0).toUpperCase() : 'К'}
          </div>

          <h1 className="text-3xl font-black mb-1">{org?.name || 'Клиент'}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {org?.entity_type === 'ip' ? 'Индивидуальный предприниматель' : org?.entity_type === 'ooo' ? 'Общество с ограниченной ответственностью' : 'Организация'}
          </p>

          <div className="space-y-4 text-left max-w-md mx-auto mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
              <p className="text-xs text-gray-400 dark:text-gray-400 font-bold uppercase mb-1 flex items-center gap-2">
                <Phone className="w-3 h-3" /> Контактный телефон
              </p>
              <p className="font-bold text-lg">{org?.contact_phone || 'Не заполнен'}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
              <p className="text-xs text-gray-400 dark:text-gray-400 font-bold uppercase mb-1 flex items-center gap-2">
                <FileText className="w-3 h-3" /> ИНН
              </p>
              <p className="font-bold text-lg">{org?.inn || 'Не заполнен'}</p>
            </div>
          </div>

          <div className="space-y-3 max-w-md mx-auto">
            <Link 
              href="/shop/settings#requisites"
              className="block w-full bg-gray-50 dark:bg-gray-700 text-black dark:text-white font-bold py-4 rounded-xl border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Мои реквизиты
            </Link>
            
            <Link 
              href="/shop/documents"
              className="block w-full bg-gray-50 dark:bg-gray-700 text-black dark:text-white font-bold py-4 rounded-xl border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Мои документы (Счета)
            </Link>
          </div>

          <button 
            onClick={handleLogout}
            className="mt-8 w-full max-w-md mx-auto bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Выйти из аккаунта
          </button>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}