'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12 w-full">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#5FC36C] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад в каталог
        </Link>
        
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm">
          <h1 className="text-3xl font-black mb-8">Наши контакты</h1>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-[#5FC36C] shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Офис и склад</h3>
                <p className="text-gray-600 mt-1">г. Москва, Каширское шоссе, д. 1</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-[#5FC36C] shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Телефон</h3>
                <p className="text-gray-600 mt-1">+7 (999) 000-00-00</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-[#5FC36C] shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Email</h3>
                <p className="text-gray-600 mt-1">b2b@pyro.ru</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}