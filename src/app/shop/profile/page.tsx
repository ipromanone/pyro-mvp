'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import Toast from '../../../components/Toast';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      if (clientData && clientData.length > 0) {
        setClientOrg(clientData[0]);
      }

      const savedCart = localStorage.getItem('pyro_cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(Object.values(cart).reduce((a: number, b: any) => a + Number(b), 0));
      }
      const savedFav = localStorage.getItem('pyro_favorites');
      if (savedFav) setFavoritesCount(JSON.parse(savedFav).length);

      setLoading(false);
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ShopHeader 
        cartCount={cartCount}
        favoritesCount={favoritesCount} 
        clientName={clientOrg?.name || 'Профиль'} 
      />
      
      <div className="max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-[#5FC36C] text-white rounded-full flex items-center justify-center text-3xl font-extrabold shadow-md">
              {clientOrg?.name ? clientOrg.name[0].toUpperCase() : <User className="w-10 h-10" />}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{clientOrg?.name || 'Название не заполнено'}</h1>
              <p className="text-sm text-gray-500">{clientOrg?.entity_type || 'Организация'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Контактный телефон</p>
                <p className="font-bold">{clientOrg?.contact_phone || 'Не заполнен'}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">ИНН</p>
                <p className="font-bold">{clientOrg?.inn || 'Не заполнен'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link 
              href="/shop/settings" 
              className="block w-full text-center bg-gray-50 text-[#1A1A1A] py-3 rounded-xl font-bold border-2 border-gray-100 hover:bg-gray-100 transition-colors"
            >
              Мои реквизиты
            </Link>
            <Link 
              href="/shop/documents" 
              className="block w-full text-center bg-gray-50 text-[#1A1A1A] py-3 rounded-xl font-bold border-2 border-gray-100 hover:bg-gray-100 transition-colors"
            >
              Мои документы (Счета)
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-500 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}