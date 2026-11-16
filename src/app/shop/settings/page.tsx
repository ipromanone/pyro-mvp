'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Toast from '../../../components/Toast';
import ThemeToggle from '../../../components/ThemeToggle';
import SettingsRequisites from './SettingsRequisites';
import { FileText, CheckCircle2, Palette } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientOrg, setClientOrg] = useState<any>(null);
  
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [clientName, setClientName] = useState('Клиент');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/'); return; }
    
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1)
      .single();

    if (org) {
      setClientOrg(org);
      setClientName(org.name || 'Клиент');
    }

    const { data: cartData } = await supabase.from('cart_items').select('quantity').eq('user_id', session.user.id);
    if (cartData) setCartCount(cartData.reduce((sum, item) => sum + item.quantity, 0));

    const { data: favData } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
    if (favData) setFavoritesCount(favData.length);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 text-[#1A1A1A] dark:text-white font-sans pb-20 transition-colors duration-300">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientName} />

      <main className="max-w-3xl mx-auto px-6 mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Настройки</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Управляйте реквизитами и внешним видом</p>
        </div>

        {/* ВОЗВРАЩАЕМ БЛОК ВНЕШНЕГО ВИДА */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm mb-8 transition-colors">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#5FC36C]/10 text-[#5FC36C] flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </span>
            Внешний вид
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
            Выберите тему интерфейса. «Системная» автоматически подстраивается под настройки вашего устройства.
          </p>
          <ThemeToggle />
        </div>

        {/* БЛОК РЕКВИЗИТОВ */}
        <div id="requisites" className="scroll-mt-24 transition-colors">
           {clientOrg ? (
             <SettingsRequisites 
               clientOrg={clientOrg} 
               setToast={setToast} 
               onRefresh={fetchData} 
             />
           ) : (
             <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
               <p className="text-gray-500 dark:text-gray-400">Организация не найдена. Пожалуйста, заполните данные.</p>
             </div>
           )}
        </div>

        {/* Ссылки на документы */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/shop/documents')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-left hover:border-[#5FC36C] dark:hover:border-[#5FC36C] transition-colors group"
          >
            <FileText className="w-8 h-8 text-[#5FC36C] mb-3" />
            <h3 className="font-black text-lg mb-1 group-hover:text-[#5FC36C] transition-colors">Мои документы</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Счета, договоры, закрывающие документы</p>
          </button>

          <button 
            onClick={() => router.push('/shop/contract')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-left hover:border-[#5FC36C] dark:hover:border-[#5FC36C] transition-colors group"
          >
            <CheckCircle2 className="w-8 h-8 text-[#5FC36C] mb-3" />
            <h3 className="font-black text-lg mb-1 group-hover:text-[#5FC36C] transition-colors">Договор поставки</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Подпишите договор для оформления заказов</p>
          </button>
        </div>
      </main>
    </div>
  );
}