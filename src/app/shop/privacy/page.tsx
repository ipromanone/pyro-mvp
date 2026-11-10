'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import { ShieldCheck, Lock, Eye, FileText, Database, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
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

      <main className="flex-grow max-w-[1000px] mx-auto px-6 pt-12 pb-20 w-full">
        
        {/* Заголовок */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-[#E3F2E3] text-[#5FC36C] px-4 py-2 rounded-full font-bold text-sm mb-6">
            <ShieldCheck className="w-5 h-5" />
            Ваша безопасность
          </div>
          <h1 className="text-4xl font-black mb-4">Политика обработки персональных данных</h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl">
            Мы серьезно относимся к защите информации наших клиентов и партнеров. 
            Настоящая политика описывает, как ИП Песня Роман Владимирович собирает, 
            использует и защищает ваши данные.
          </p>
          <p className="text-sm font-bold text-gray-400 mt-4">Редакция от 01 января 2024 года</p>
        </div>

        {/* Блоки с правилами */}
        <div className="space-y-6">
          
          {/* 1. Общие положения */}
          <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center text-[#5FC36C]">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">1. Общие положения</h2>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed">
              1.1. Настоящая Политика разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
              <br/><br/>
              1.2. Оператором персональных данных является ИП Песня Роман Владимирович (ИНН 140210483747), далее — «Оператор».
              <br/><br/>
              1.3. Политика определяет порядок обработки персональных данных и меры по обеспечению их безопасности, предпринимаемые Оператором.
            </p>
          </div>

          {/* 2. Какие данные мы собираем */}
          <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center text-[#5FC36C]">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">2. Состав обрабатываемых данных</h2>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed mb-4">
              Оператор обрабатывает следующие категории данных, необходимых для ведения оптовой торговли:
            </p>
            <ul className="list-disc list-inside text-gray-600 font-medium space-y-2 ml-2">
              <li>ФИО руководителя или контактного лица;</li>
              <li>Контактный телефон и адрес электронной почты;</li>
              <li>Реквизиты организации (ИНН, КПП, ОГРН, юридический адрес);</li>
              <li>Данные об истории заказов и платежей.</li>
            </ul>
          </div>

          {/* 3. Цели обработки */}
          <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center text-[#5FC36C]">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">3. Цели обработки данных</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 font-medium space-y-2 ml-2">
              <li>Заключение и исполнение договоров поставки;</li>
              <li>Формирование и выставление счетов на оплату;</li>
              <li>Организация доставки товара;</li>
              <li>Информирование клиента о статусе заказа.</li>
            </ul>
          </div>

          {/* 4. Защита данных */}
          <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center text-[#5FC36C]">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">4. Меры по защите данных</h2>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed">
              Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования и распространения.
              <br/><br/>
              Доступ к данным имеют только уполномоченные сотрудники, подписавшие соглашение о конфиденциальности. Передача данных третьим лицам осуществляется только в случаях, предусмотренных законодательством РФ (например, транспортным компаниям для доставки).
            </p>
          </div>

          {/* 5. Права пользователей */}
          <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center text-[#5FC36C]">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">5. Права субъектов данных</h2>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed">
              Вы имеете право:
            </p>
            <ul className="list-disc list-inside text-gray-600 font-medium space-y-2 ml-2 mt-2">
              <li>Требовать уточнения, блокирования или уничтожения ваших данных;</li>
              <li>Отозвать согласие на обработку персональных данных;</li>
              <li>Получать информацию о том, какие данные обрабатываются.</li>
            </ul>
            <p className="text-gray-600 font-medium leading-relaxed mt-4">
              Для реализации своих прав вы можете направить официальный запрос на нашу электронную почту: 
              <a href="mailto:bz.ipromanone@yandex.ru" className="text-[#5FC36C] font-bold hover:underline ml-1">bz.ipromanone@yandex.ru</a>
            </p>
          </div>

        </div>
      </main>

      
    </div>
  );
}
