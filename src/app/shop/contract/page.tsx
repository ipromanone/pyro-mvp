'use client';

console.log('Я в файле CONTRACT');

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Toast from '../../../components/Toast';
import { ArrowLeft, FileText, CheckCircle, Download, ShieldCheck } from 'lucide-react';

export default function ContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSigned, setIsSigned] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
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
        setIsSigned(clientData[0].contract_signed || false);
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

  const handleSignContract = async () => {
    if (!clientOrg) {
      setToast({ message: 'Организация не найдена. Заполните реквизиты.', type: 'error' });
      return;
    }

    setIsSigning(true);
    const { error } = await supabase.from('organizations').update({ 
      contract_signed: true,
      contract_number: `Д-${Math.floor(Math.random() * 10000) + 1000}`,
      contract_date: new Date().toISOString().split('T')[0]
    }).eq('id', clientOrg.id);

    if (error) {
      setToast({ message: 'Ошибка подписания: ' + error.message, type: 'error' });
    } else {
      setIsSigned(true);
      setToast({ message: 'Договор успешно подписан!', type: 'success' });
      setTimeout(() => router.push('/shop/cart'), 1500);
    }
    setIsSigning(false);
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />

      <div className="max-w-[800px] mx-auto px-6 pt-8">
        <Link href="/shop/cart" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#5FC36C] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад в корзину
        </Link>

        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
              <FileText className="w-10 h-10 text-[#5FC36C]" />
            </div>
            <h1 className="text-3xl font-black mb-2">Договор поставки</h1>
            <p className="text-gray-500 font-medium">Для оформления заказов необходимо подписать договор.</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 text-sm text-gray-600 font-medium leading-relaxed h-64 overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-2">1. Общие положения</h3>
            <p className="mb-4">Настоящий договор регулирует отношения между Поставщиком и Покупателем при закупке пиротехнической продукции...</p>
            <h3 className="font-bold text-gray-900 mb-2">2. Права и обязанности сторон</h3>
            <p className="mb-4">Поставщик обязуется передать товар, а Покупатель — принять и оплатить его в срок...</p>
            <h3 className="font-bold text-gray-900 mb-2">3. Ответственность</h3>
            <p>Стороны несут ответственность в соответствии с законодательством РФ...</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:border-[#5FC36C] hover:text-[#5FC36C] transition-colors">
              <Download className="w-5 h-5" /> Скачать PDF
            </button>
            
            {isSigned ? (
              <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 px-8 py-3 rounded-xl font-bold border border-green-200">
                <CheckCircle className="w-5 h-5" /> Договор подписан
              </div>
            ) : (
              <button 
                onClick={handleSignContract} 
                disabled={isSigning}
                className="flex items-center justify-center gap-2 bg-[#5FC36C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" /> {isSigning ? 'Подписание...' : 'Подписать договор'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}