'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { Truck, Percent, ShieldCheck, ArrowRight, Phone } from 'lucide-react';

export default function BecomePartnerPage() {
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
        if (clientData && clientData.length > 0) setClientOrg(clientData[0]);
      }
      const savedCart = localStorage.getItem('pyro_cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(Object.values(cart).reduce((a: number, b: any) => a + Number(b), 0));
      }
      const savedFav = localStorage.getItem('pyro_favorites');
      if (savedFav) setFavoritesCount(JSON.parse(savedFav).length);
    }
    init();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />

      <main className="flex-grow max-w-[1200px] mx-auto px-6 pt-12 pb-20 w-full">
        
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Станьте оптовым партнером Pyro</h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            Получите доступ к эксклюзивным ценам, широкому ассортименту и удобному 
            личному кабинету для управления закупками.
          </p>
        </div>

        {/* Преимущества */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#E3F2E3] rounded-2xl flex items-center justify-center text-[#5FC36C] mx-auto mb-6">
              <Percent className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black mb-3">Лучшие цены</h3>
            <p className="text-gray-500 font-medium">Прямые контракты с производителями и гибкая система скидок от объема закупок.</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#E3F2E3] rounded-2xl flex items-center justify-center text-[#5FC36C] mx-auto mb-6">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black mb-3">Быстрая доставка</h3>
            <p className="text-gray-500 font-medium">Собственная логистика и проверенные перевозчики. Доставим точно в срок.</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#E3F2E3] rounded-2xl flex items-center justify-center text-[#5FC36C] mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black mb-3">Гарантия качества</h3>
            <p className="text-gray-500 font-medium">Только сертифицированная продукция, соответствующая всем стандартам безопасности.</p>
          </div>
        </div>

        {/* Как начать работать */}
        <div className="bg-[#1A1A1A] rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5FC36C] opacity-20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
          
          <h2 className="text-3xl font-black text-white mb-4 relative z-10">Готовы начать?</h2>
          <p className="text-gray-400 font-medium mb-8 max-w-lg mx-auto relative z-10">
            Для получения доступа к оптовым ценам вам необходимо подписать договор поставки. 
            Это займет не более 5 минут.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link href="/shop/contract" className="inline-flex items-center justify-center gap-2 bg-[#5FC36C] text-white px-8 py-4 rounded-xl font-black hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20">
              Подписать договор <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+79153984966" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">
              <Phone className="w-5 h-5" /> Связаться с нами
            </a>
          </div>
        </div>

      </main>

      
    </div>
  );
}
