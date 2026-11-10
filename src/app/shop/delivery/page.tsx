'use client';

import Link from 'next/link';
import { ArrowLeft, Truck, MapPin, Package, ShieldCheck, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      
      {/* Шапка страницы */}
      <div className="max-w-[1200px] mx-auto px-6 pt-8">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#5FC36C] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад в каталог
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black mb-4">Доставка и логистика</h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl">
            Мы понимаем, что пиротехника — это специфический груз. Поэтому мы обеспечиваем 
            безопасную и своевременную доставку по всей России.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 space-y-8">
        
        {/* Блок 1: Способы доставки (Карточки) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E3F2E3] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <MapPin className="w-10 h-10 text-[#5FC36C] mb-6 relative z-10" />
            <h3 className="text-xl font-black mb-3">Самовывоз со склада</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Заберите заказ самостоятельно с нашего склада в Москве. Это самый быстрый и бесплатный способ.
            </p>
            <div className="space-y-2 text-sm font-bold">
              <p className="flex justify-between border-b border-gray-100 pb-2"><span>Срок:</span> <span>В день оплаты</span></p>
              <p className="flex justify-between"><span>Стоимость:</span> <span className="text-[#5FC36C]">Бесплатно</span></p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E3F2E3] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <Truck className="w-10 h-10 text-[#5FC36C] mb-6 relative z-10" />
            <h3 className="text-xl font-black mb-3">Доставка продавца</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Собственная курьерская служба. Доставляем по Москве и области с соблюдением всех норм перевозки опасных грузов.
            </p>
            <div className="space-y-2 text-sm font-bold">
              <p className="flex justify-between border-b border-gray-100 pb-2"><span>Срок:</span> <span>1-2 дня</span></p>
              <p className="flex justify-between"><span>Стоимость:</span> <span>от 500 ₽</span></p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E3F2E3] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <Package className="w-10 h-10 text-[#5FC36C] mb-6 relative z-10" />
            <h3 className="text-xl font-black mb-3">Транспортные компании</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Отправляем по всей России через партнеров (Яндекс Доставка, Достависта). Условия согласовываются индивидуально.
            </p>
            <div className="space-y-2 text-sm font-bold">
              <p className="flex justify-between border-b border-gray-100 pb-2"><span>Срок:</span> <span>от 3 дней</span></p>
              <p className="flex justify-between"><span>Стоимость:</span> <span>По тарифу ТК</span></p>
            </div>
          </div>
        </div>

        {/* Блок 2: Безопасность (Текст + Иконки) */}
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-[#5FC36C]" />
            <h2 className="text-2xl font-black">Безопасность перевозки</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-gray-600 font-medium leading-relaxed">
                Пиротехника относится к классу опасных грузов. Мы строго соблюдаем правила 
                транспортировки, чтобы исключить любые риски для вас и ваших клиентов.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-[#5FC36C] shrink-0" /> 
                  Специальная упаковка, исключающая трение и искры
                </li>
                <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-[#5FC36C] shrink-0" /> 
                  Наличие всех сопроводительных документов и сертификатов
                </li>
                <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-[#5FC36C] shrink-0" /> 
                  Обученные водители с допуском к перевозке опасных грузов
                </li>
              </ul>
            </div>
            <div className="bg-[#F4F9F4] p-6 rounded-2xl border border-[#E3F2E3]">
              <h4 className="font-bold text-gray-900 mb-2">Важно!</h4>
              <p className="text-sm text-gray-600 font-medium">
                При получении заказа обязательно проверьте целостность упаковки и наличие пломб. 
                Если вы заметили повреждения — откажитесь от получения и свяжитесь с нашим менеджером.
              </p>
            </div>
          </div>
        </div>

        {/* Блок 3: Часто задаваемые вопросы */}
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-black mb-8">Частые вопросы о доставке</h2>
          <div className="space-y-6">
            
            <div>
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5FC36C]" /> Как быстро вы отгружаете товар?
              </h4>
              <p className="text-gray-600 font-medium pl-7">
                Отгрузка со склада происходит в течение 24 часов после подтверждения оплаты. 
                Если товар находится под заказ у оптовика — срок согласовывается отдельно.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#5FC36C]" /> Вы доставляете в другие регионы?
              </h4>
              <p className="text-gray-600 font-medium pl-7">
                Да, мы работаем с транспортными компаниями по всей России. Стоимость и сроки 
                рассчитываются индивидуально в зависимости от региона и веса груза.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#5FC36C]" /> Что делать, если товар пришел с браком?
              </h4>
              <p className="text-gray-600 font-medium pl-7">
                В случае обнаружения брака или недостачи, составьте акт при получении и свяжитесь 
                с нами в течение 24 часов. Мы заменим товар или вернем деньги.
              </p>
            </div>

          </div>
        </div>

        {/* Кнопка возврата */}
        <div className="text-center pt-6">
          <Link href="/shop" className="inline-flex items-center gap-2 bg-[#5FC36C] text-white px-8 py-4 rounded-xl font-black hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20">
            Перейти в каталог <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}