'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import ShopHeader from '../../../components/ShopHeader';
import Toast from '../../../components/Toast';
import { Phone, Mail, MapPin, Building2, CreditCard, Copy, Check } from 'lucide-react';

export default function ContactsPage() {
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyRequisites = () => {
    const text = `
ИП Песня Роман Владимирович
ИНН: 140210483747
ОГРНИП: 326911200020135
Р/с: 40802810300810276675
Банк: Филиал "Центральный" Банка ВТБ (ПАО)
БИК: 044525411
К/с: 30101810145250000411
Юр. адрес: г Москва, Каширское шоссе, д 1
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setToast({ message: 'Реквизиты скопированы в буфер обмена', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />

      <main className="flex-grow max-w-[1200px] mx-auto px-6 pt-12 pb-20 w-full">
        
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-4">Контакты</h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl">
            Мы всегда на связи. Свяжитесь с нами по любым вопросам оптовых закупок, 
            логистики или сотрудничества.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ЛЕВАЯ КОЛОНКА: Контактные данные */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E3F2E3] rounded-xl flex items-center justify-center text-[#5FC36C] shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase mb-1">Телефон</p>
                <a href="tel:+79153984966" className="text-lg font-black hover:text-[#5FC36C] transition-colors">+7 (915) 398-49-66</a>
                <p className="text-sm text-gray-500 font-medium mt-1">Пн-Пт с 10:00 до 19:00</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E3F2E3] rounded-xl flex items-center justify-center text-[#5FC36C] shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase mb-1">Email</p>
                <a href="mailto:bz.ipromanone@yandex.ru" className="text-lg font-black hover:text-[#5FC36C] transition-colors break-all">bz.ipromanone@yandex.ru</a>
                <p className="text-sm text-gray-500 font-medium mt-1">Для запросов и документов</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E3F2E3] rounded-xl flex items-center justify-center text-[#5FC36C] shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase mb-1">Юридический адрес</p>
                <p className="text-base font-bold leading-tight">г. Москва, Каширское шоссе, д. 1</p>
                <p className="text-sm text-gray-500 font-medium mt-1">Самовывоз по предварительной записи</p>
              </div>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: Реквизиты (Карточка предприятия) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden h-full">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-2xl font-black">Реквизиты организации</h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">Для оформления договоров и платежей</p>
                </div>
                <button 
                  onClick={copyRequisites}
                  className="flex items-center gap-2 bg-[#5FC36C] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors shadow-sm"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Скопировано' : 'Скопировать'}
                </button>
              </div>

              <div className="p-8 space-y-8">
                
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#5FC36C]">
                    <Building2 className="w-5 h-5" />
                    Данные организации
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-400 font-bold mb-1">Полное наименование</p>
                      <p className="font-medium">Индивидуальный предприниматель Песня Роман Владимирович</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">Сокращенное наименование</p>
                      <p className="font-medium">ИП Песня Роман Владимирович</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">ИНН</p>
                      <p className="font-medium">140210483747</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">ОГРНИП</p>
                      <p className="font-medium">326911200020135</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">ОКПО</p>
                      <p className="font-medium">0205650988</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">ОКАТО / ОКТМО</p>
                      <p className="font-medium">35401000000 / 35701000001</p>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#5FC36C]">
                    <CreditCard className="w-5 h-5" />
                    Банковские реквизиты
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="md:col-span-2">
                      <p className="text-gray-400 font-bold mb-1">Наименование банка</p>
                      <p className="font-medium">Филиал "Центральный" Банка ВТБ (ПАО)</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">БИК</p>
                      <p className="font-medium">044525411</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">Расчетный счет</p>
                      <p className="font-medium">40802810300810276675</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">Корреспондентский счет</p>
                      <p className="font-medium">30101810145250000411</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold mb-1">ИНН / КПП банка</p>
                      <p className="font-medium">7702070139 / 770943002</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}