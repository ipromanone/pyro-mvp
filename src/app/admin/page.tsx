'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import Toast from '../../components/Toast';
import { RefreshCw } from 'lucide-react';

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const loadData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleRefresh = () => {
    loadData(false);
    setToast({ message: 'Данные обновлены', type: 'success' });
  };

  const getPaymentName = (code: string) => {
    if (code === 'Счет') return 'Счет';
    if (code === 'Карта') return 'Карта';
    if (code === 'Наличные') return 'Наличные';
    return code;
  };

  const getDeliveryName = (code: string) => {
    switch (code) {
      case 'pickup': return 'Самовывоз';
      case 'seller': return 'Доставка продавца';
      case 'yandex': return 'Яндекс';
      case 'dostavista': return 'Достависта';
      default: return code || '—';
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <span className="text-xs text-gray-400">Новый</span>;
    
    const map: Record<string, string> = {
      'Ожидает оплаты': 'bg-yellow-100 text-yellow-700',
      'На сборке': 'bg-blue-100 text-blue-700',
      'В пути': 'bg-purple-100 text-purple-700',
      'Доставлен': 'bg-green-100 text-green-700',
      'Собран': 'bg-teal-100 text-teal-700',
      'Отгружен': 'bg-indigo-100 text-indigo-700',
    };
    
    return (
      <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  if (loading && orders.length === 0) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F4F9F4] font-sans text-[#1A1A1A] pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white border-b border-[#E3F2E3] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[#4CAF50]">Управление</h1>
          <div className="flex gap-4 items-center">
            <button 
              onClick={handleRefresh} 
              disabled={loading}
              className="flex items-center gap-2 text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
              {loading ? 'Обновление...' : 'Обновить'}
            </button>
            
            <Link href="/admin/my-orgs" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Мои организации</Link>
            <Link href="/admin/clients" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Клиенты</Link>
            <Link href="/admin" className="text-sm font-bold bg-[#5FC36C] text-white px-4 py-2 rounded-xl shadow-sm">Заказы</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <h2 className="text-xl font-black mb-4">Все заказы</h2>
        
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[200px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-sm text-gray-500">№ Заказа</th>
                  <th className="px-6 py-4 font-bold text-sm text-gray-500">Дата</th>
                  <th className="px-6 py-4 font-bold text-sm text-gray-500">Клиент</th>
                  <th className="px-6 py-4 font-bold text-sm text-gray-500">Сумма</th>
                  <th className="px-6 py-4 font-bold text-sm text-gray-500">Оплата</th>
                  <th className="px-6 py-4 font-bold text-sm text-gray-500">Доставка</th>
                  <th className="px-6 py-4 font-bold text-sm text-gray-500">Статус</th>
                  <th className="px-6 py-4 font-bold text-sm text-gray-500 text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-sm">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                    <td className="px-6 py-4 text-sm font-medium">{order.customer_name}</td>
                    <td className="px-6 py-4 font-black whitespace-nowrap">{order.total_price} ₽</td>
                    <td className="px-6 py-4 text-sm">{getPaymentName(order.payment_method)}</td>
                    <td className="px-6 py-4 text-sm">{getDeliveryName(order.delivery_method)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.delivery_status)}</td>
                    <td className="px-6 py-4 flex justify-center">
                      <Link href={`/admin/orders/${order.id}`} className="text-[#5FC36C] font-bold hover:text-[#4CAF50] bg-[#E3F2E3] px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap">
                        Подробнее
                      </Link>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr><td colSpan={8} className="p-12 text-center text-gray-500 font-medium">Заказов пока нет</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}