'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Колонка 1: Логотип и описание */}
          <div className="lg:col-span-2">
            <Link href="/shop" className="inline-block text-4xl font-black text-black tracking-tighter mb-4">
              Pyro<span className="text-[#5FC36C]">.</span>
            </Link>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mb-6">
              B2B-платформа для оптовых закупок пиротехники и товаров для праздника. 
              Мы делаем ваш бизнес ярче, а закупки — проще.
            </p>
            <div className="flex gap-3">
              {/* Заглушки для соцсетей, если понадобятся */}
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#5FC36C] hover:border-[#5FC36C] transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.582 6.186a2.6 2.6 0 0 0-1.84-1.84C18.16 4 12 4 12 4s-6.16 0-7.742.346a2.6 2.6 0 0 0-1.84 1.84C2 7.77 2 12 2 12s0 4.23.418 5.814a2.6 2.6 0 0 0 1.84 1.84C5.84 20 12 20 12 20s6.16 0 7.742-.346a2.6 2.6 0 0 0 1.84-1.84C22 16.23 22 12 22 12s0-4.23-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z"/></svg>
              </div>
            </div>
          </div>

          {/* Колонка 2: Покупателям */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-5">Покупателям</h4>
            <ul className="space-y-3">
              <li><Link href="/shop/about" className="text-sm font-medium text-gray-500 hover:text-[#5FC36C] transition-colors">О компании</Link></li>
              <li><Link href="/shop/delivery" className="text-sm font-medium text-gray-500 hover:text-[#5FC36C] transition-colors">Доставка и оплата</Link></li>
              <li><Link href="/shop/help" className="text-sm font-medium text-gray-500 hover:text-[#5FC36C] transition-colors">Помощь и возврат</Link></li>
              <li><Link href="/shop/privacy" className="text-sm font-medium text-gray-500 hover:text-[#5FC36C] transition-colors">Политика конфиденциальности</Link></li>
            </ul>
          </div>

          {/* Колонка 3: Партнерам */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-5">Партнерам</h4>
            <ul className="space-y-3">
              <li><Link href="/shop/become-partner" className="text-sm font-medium text-gray-500 hover:text-[#5FC36C] transition-colors">Стать партнером</Link></li>
              <li><Link href="/shop/contract" className="text-sm font-medium text-gray-500 hover:text-[#5FC36C] transition-colors">Договор поставки</Link></li>
              <li><Link href="/shop/documents" className="text-sm font-medium text-gray-500 hover:text-[#5FC36C] transition-colors">Мои документы</Link></li>
            </ul>
          </div>

          {/* Колонка 4: Контакты */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-5">Контакты</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#5FC36C] shrink-0" />
                <div>
                  <a href="tel:+79990000000" className="text-sm font-bold text-gray-900 hover:text-[#5FC36C] transition-colors">+7 (999) 000-00-00</a>
                  <p className="text-xs text-gray-400 font-medium mt-1">Пн-Пт с 9:00 до 18:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#5FC36C] shrink-0" />
                <div>
                  <a href="mailto:b2b@pyro.ru" className="text-sm font-bold text-gray-900 hover:text-[#5FC36C] transition-colors">b2b@pyro.ru</a>
                  <p className="text-xs text-gray-400 font-medium mt-1">Для запросов и документов</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#5FC36C] shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">г. Москва, Каширское шоссе, д. 1</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Самовывоз по записи</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Нижняя линия */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 font-medium">
            2010 - {new Date().getFullYear()} ООО "Pyro". Все права защищены.
          </p>
          <div className="flex gap-6">
            <Link href="/shop/privacy" className="text-xs text-gray-400 hover:text-[#5FC36C] transition-colors">Политика конфиденциальности</Link>
            <Link href="/shop/contract" className="text-xs text-gray-400 hover:text-[#5FC36C] transition-colors">Пользовательское соглашение</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}