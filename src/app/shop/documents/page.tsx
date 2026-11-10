'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Toast from '../../../components/Toast';
import { ArrowLeft, FileText, Download, FileCheck, ShieldCheck } from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }

      // Загружаем организацию
      const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      if (clientData && clientData.length > 0) {
        setClientOrg(clientData[0]);
      }

      // Загружаем счета
      if (session.user.id) {
        const { data: invoicesData } = await supabase.from('invoices').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (invoicesData) setInvoices(invoicesData);
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

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />

      <div className="max-w-[1000px] mx-auto px-6 pt-8">
        <Link href="/shop/profile" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#5FC36C] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад в профиль
        </Link>

        <h1 className="text-4xl font-black mb-8">Мои документы</h1>

        <div className="space-y-8">
          
          {/* БЛОК 1: ДОГОВОР */}
          <div>
            <h2 className="text-xl font-black mb-4">Договоры</h2>
            {clientOrg?.contract_signed ? (
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-xl text-[#5FC36C]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Договор поставки № {clientOrg.contract_number || '—'}</p>
                    <p className="text-sm text-gray-500 font-medium">от {clientOrg.contract_date || '—'}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:border-[#5FC36C] hover:text-[#5FC36C] transition-colors">
                  <Download className="w-4 h-4" /> Скачать PDF
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center text-gray-500 font-medium">
                Договор еще не подписан. <Link href="/shop/contract" className="text-[#5FC36C] underline">Подписать сейчас</Link>
              </div>
            )}
          </div>

          {/* БЛОК 2: СЧЕТА */}
          <div>
            <h2 className="text-xl font-black mb-4">Счета на оплату</h2>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              {invoices.length === 0 ? (
                <div className="p-12 text-center text-gray-500 font-medium">
                  У вас пока нет выставленных счетов.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Счет № {inv.invoice_number}</p>
                          <p className="text-sm text-gray-500 font-medium">
                            от {new Date(inv.created_at).toLocaleDateString('ru-RU')} • {inv.amount} ₽
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${inv.status === 'Ожидает оплаты' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {inv.status}
                        </span>
                        <button className="text-gray-400 hover:text-[#5FC36C] p-2">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}