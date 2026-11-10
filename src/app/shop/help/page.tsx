'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import { HelpCircle, Mail, Phone } from 'lucide-react';

export default function HelpPage() {
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

      <main className="flex-grow max-w-[800px] mx-auto px-6 pt-12 pb-20 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#E3F2E3] rounded-full text-[#5FC36C] mb-6">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black mb-4">Центр помощи</h1>
          <p className="text-lg text-gray-500 font-medium">
            Найдите ответы на частые вопросы или свяжитесь с нашей поддержкой.
          </p>
        </div>

        {/* Частые вопросы */}
        <div className="space-y-4 mb-12">
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2">Как оформить заказ?</h3>
            <p className="text-gray-600 font-medium">Добавьте товары в корзину, перейдите в раздел оформления и выберите способ оплаты. Счет формируется автоматически.</p>
          </div>
          
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2">Где скачать счет на оплату?</h3>
            <p className="text-gray-600 font-medium">Все сформированные счета хранятся в разделе «Мои документы» в вашем личном кабинете.</p>
          </div>

          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2">Как изменить реквизиты?</h3>
            <p className="text-gray-600 font-medium">Перейдите в «Профиль» → «Мои реквизиты» и обновите необходимые данные.</p>
          </div>
        </div>

        {/* Контакты поддержки */}
        <div className="bg-[#1A1A1A] rounded-[2rem] p-8 text-center">
          <h2 className="text-2xl font-black text-white mb-4">Не нашли ответ?</h2>
          <p className="text-gray-400 font-medium mb-6">Наши менеджеры готовы помочь вам с любым вопросом.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="mailto:bz.ipromanone@yandex.ru" className="inline-flex items-center justify-center gap-2 bg-[#5FC36C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors">
              <Mail className="w-5 h-5" /> Написать на почту
            </a>
            <a href="tel:+79153984966" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors">
              <Phone className="w-5 h-5" /> Позвонить
            </a>
          </div>
        </div>
      </main>

      
    </div>
  );
}
