'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import Toast from '../../../components/Toast';
import { User, Shield, FileText, Bell } from 'lucide-react';

import SettingsProfile from './SettingsProfile';
import SettingsSecurity from './SettingsSecurity';
import SettingsRequisites from './SettingsRequisites';
import SettingsNotifications from './SettingsNotifications';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'requisites' | 'notifications'>('profile');
  const [loading, setLoading] = useState(true);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  
  // Ключ для перемонтирования компонента
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/'); return; }
    
    const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
    if (clientData && clientData.length > 0) setClientOrg(clientData[0]);

    const savedCart = localStorage.getItem('pyro_cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartCount(Object.values(cart).reduce((a: number, b: any) => a + Number(b), 0));
    }
    const savedFav = localStorage.getItem('pyro_favorites');
    if (savedFav) setFavoritesCount(JSON.parse(savedFav).length);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Функция обновления: перезагружает данные и меняет ключ
  const handleRefresh = async () => {
    await loadData();
    setRefreshKey(prev => prev + 1); // Меняем ключ -> компонент перемонтируется
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />

      <div className="flex-grow max-w-[1400px] mx-auto px-6 mt-8 pb-20 w-full">
        <h1 className="text-3xl font-black mb-8">Настройки</h1>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-[1.5rem] p-2 shadow-sm border border-gray-100 flex flex-col gap-1">
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'profile' ? 'bg-[#5FC36C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <User className="w-5 h-5" /> Мои данные
              </button>
              <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'security' ? 'bg-[#5FC36C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Shield className="w-5 h-5" /> Безопасность
              </button>
              <button onClick={() => setActiveTab('requisites')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'requisites' ? 'bg-[#5FC36C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <FileText className="w-5 h-5" /> Реквизиты
              </button>
              <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'notifications' ? 'bg-[#5FC36C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Bell className="w-5 h-5" /> Уведомления
              </button>
            </div>
          </aside>

          <main className="flex-grow w-full bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 min-h-[500px]">
            {activeTab === 'profile' && <SettingsProfile clientOrg={clientOrg} setToast={setToast} />}
            {activeTab === 'security' && <SettingsSecurity setToast={setToast} />}
            {/* key={refreshKey} перемонтирует компонент при изменении ключа */}
            {activeTab === 'requisites' && (
              <SettingsRequisites 
                key={refreshKey} 
                clientOrg={clientOrg} 
                setToast={setToast} 
                onRefresh={handleRefresh} 
              />
            )}
            {activeTab === 'notifications' && <SettingsNotifications />}
          </main>
        </div>
      </div>

      
    </div>
  );
}
