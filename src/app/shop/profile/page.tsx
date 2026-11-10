'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
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

      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />
      
      <div className="max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          {/* ... (Карточка профиля, она не меняется) ... */}
        </div>
      </div>
    </div>
  );
}