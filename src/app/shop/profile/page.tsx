'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Toast from '../../../components/Toast';
import { User, Phone, FileText, Settings, LogOut, ChevronRight, Building2 } from 'lucide-react';

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
      if (!session) { 
        router.push('/'); 
        return; 
      }
      
      // Загружаем данные организации
      const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      if (clientData && clientData.length > 0) {
        setClientOrg(clientData[0]);
      }

      // Счетчики для шапки
      const savedCart = localStorage.getItem('pyro_cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(Object.values(cart).reduce((a: number, b: any) => a + Number(b), 0));
      }
      const savedFav = localStorage.getItem('pyro_favorites');
      if (savedFav) setFavoritesCount(JSON.parse(savedFav).length);

      // Обязательно отключаем загрузку
      setLoading(false);
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  // Если идет загрузка, показываем пустой фон (без мигания)
  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ShopHeader 
        cartCount={cartCount} 
        favoritesCount={favoritesCount} 
        clientName={clientOrg?.name || 'Профиль'} 
      />
      
      <div className="max-w-[800px] mx-auto px-6 mt-12">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100">
          
          {/* Шапка профиля */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-10 text-center md:text-left">
            <div className="w-24 h-24 bg-[#E3F2E3] text-[#5FC36C] rounded-full flex items-center justify-center text-4xl font-black shadow-sm border border-green-100">
              {clientOrg?.name ? clientOrg.name[0].toUpperCase() : <User className="w-10 h-10" />}
            </div>
            <div>
              <h1 className="text-3xl font-black mb-2">{clientOrg?.name || 'Название организации не заполнено'}</h1>
              <p className="text-gray-500 font-bold flex items-center justify-center md:justify-start gap-2">
                <Building2 className="w-4 h-4" />
                {clientOrg?.entity_type || 'Юридическое лицо'}
              </p>
            </div>
          </div>

          {/* Карточки с данными */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Phone className="w-5 h-5" />
                <p className="text-xs font-bold uppercase">Контактный телефон</p>
              </div>
              <p className="font-black text-lg">{clientOrg?.contact_phone || 'Не заполнен'}</p>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <FileText className="w-5 h-5" />
                <p className="text-xs font-bold uppercase">ИНН</p>
              </div>
              <p className="font-black text-lg">{clientOrg?.inn || 'Не заполнен'}</p>
            </div>
          </div>

          {/* Ссылки на разделы */}
          <div className="space-y-3">
            <Link href="/shop/settings" className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#5FC36C] hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-50 rounded-lg text-[#5FC36C]"><Settings className="w-5 h-5" /></div>
                <span className="font-bold text-lg">Мои реквизиты и настройки</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#5FC36C]" />
            </Link>
            
            <Link href="/shop/documents" className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#5FC36C] hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-50 rounded-lg text-[#5FC36C]"><FileText className="w-5 h-5" /></div>
                <span className="font-bold text-lg">Мои документы (Счета)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#5FC36C]" />
            </Link>
          </div>

          {/* Кнопка выхода */}
          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <button onClick={handleLogout} className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors">
              <LogOut className="w-5 h-5" /> Выйти из аккаунта
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}