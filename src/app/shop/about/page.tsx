'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ShopHeader from '../../../components/ShopHeader';
import { ShieldCheck, Truck, Box, Users, ArrowRight, Zap } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();
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

      <main className="flex-grow">
        {/* БЛОК 1: ГЛАВНЫЙ БАННЕР */}
        <section className="max-w-[1400px] mx-auto px-6 pt-12 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                Ваш надежный партнер <br className="hidden md:block"/> в мире пиротехники
              </h1>
              <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed max-w-lg">
                Мы объединяем ведущих производителей и розничные сети по всей России. 
                Наша цель — сделать оптовые закупки праздничной продукции простыми, 
                безопасными и выгодными для вашего бизнеса.
              </p>
              <Link href="/shop" className="inline-flex items-center gap-2 bg-[#5FC36C] text-white px-8 py-4 rounded-xl font-black hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20">
                Перейти в каталог
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-3xl font-black text-[#5FC36C] mb-1">2 500+</p>
                  <p className="text-sm font-bold text-gray-500">Активных B2B-клиентов</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-[#5FC36C] mb-1">10 000+</p>
                  <p className="text-sm font-bold text-gray-500">SKU в постоянном наличии</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-[#5FC36C] mb-1">85</p>
                  <p className="text-sm font-bold text-gray-500">Регионов присутствия</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-[#5FC36C] mb-1">100%</p>
                  <p className="text-sm font-bold text-gray-500">Сертифицированный товар</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* БЛОК 2: НАШИ СЕРВИСЫ */}
        <section className="max-w-[1400px] mx-auto px-6 py-16">
          <h2 className="text-3xl font-black mb-8">Сервисы для вашего бизнеса</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#E3F2E3] rounded-2xl flex items-center justify-center text-[#5FC36C] mb-6">
                <Box className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-3">Удобный личный кабинет</h3>
              <p className="text-gray-500 font-medium mb-6">
                Забудьте про прайс-листы в Excel. Актуальные остатки, резервирование товара 
                и автоматическое формирование счетов в пару кликов.
              </p>
              <Link href="/shop" className="text-[#5FC36C] font-bold flex items-center gap-2 hover:underline">
                Попробовать <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#E3F2E3] rounded-2xl flex items-center justify-center text-[#5FC36C] mb-6">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-3">Надежная логистика</h3>
              <p className="text-gray-500 font-medium mb-6">
                Собственный автопарк и партнерские СТС. Доставим опасный груз 
                с соблюдением всех норм безопасности точно в срок.
              </p>
              <Link href="/shop/documents" className="text-[#5FC36C] font-bold flex items-center gap-2 hover:underline">
                Условия доставки <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* БЛОК 3: НОВОСТИ И АНОНСЫ */}
        <section className="bg-[#1A1A1A] py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#5FC36C] opacity-10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-black text-white">Новости сезона</h2>
              <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Все новости</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/10">
                <p className="text-xs font-bold text-[#5FC36C] mb-3">15 ноября 2024</p>
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">Открытие предзаказа на пиротехнические шоу 2025</h3>
                <p className="text-sm text-gray-400">Успейте забронировать батареи и салюты по фиксированным ценам до конца месяца.</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/10">
                <p className="text-xs font-bold text-[#5FC36C] mb-3">01 ноября 2024</p>
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">Новые поступления бенгальских огней</h3>
                <p className="text-sm text-gray-400">Расширили ассортимент цветных и подарочных бенгальских огней. Обновления в каталоге.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/10">
                <p className="text-xs font-bold text-[#5FC36C] mb-3">20 октября 2024</p>
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">Маркировка пиротехники: новые правила</h3>
                <p className="text-sm text-gray-400">Напоминаем о переходе на систему маркировки «Честный знак» с 2025 года.</p>
              </div>
            </div>
          </div>
        </section>

        {/* БЛОК 4: БЕЗОПАСНОСТЬ */}
        <section className="max-w-[1400px] mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-black mb-4">Безопасность превыше всего</h2>
              <p className="text-gray-500 font-medium">
                Мы понимаем специфику работы с опасными грузами. Наша репутация 
                строится на строгом соблюдении законодательства и заботе о конечном потребителе.
              </p>
            </div>

            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#E3F2E3] p-8 rounded-[2rem]">
                <ShieldCheck className="w-10 h-10 text-[#5FC36C] mb-4" />
                <h3 className="text-xl font-bold mb-2">100% сертификация</h3>
                <p className="text-sm text-gray-600 font-medium">Каждая партия товара сопровождается полным пакетом документов и деклараций соответствия.</p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <Zap className="w-10 h-10 text-[#5FC36C] mb-4" />
                <h3 className="text-xl font-bold mb-2">Прослеживаемость</h3>
                <p className="text-sm text-gray-600 font-medium">Знаем путь каждой коробки: от завода-изготовителя до полки в вашем магазине.</p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <Users className="w-10 h-10 text-[#5FC36C] mb-4" />
                <h3 className="text-xl font-bold mb-2">Помощь менеджера</h3>
                <p className="text-sm text-gray-600 font-medium">Всегда на связи и поможем подобрать товар, основываясь на специфике вашего региона.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}