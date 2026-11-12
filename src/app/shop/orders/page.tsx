'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import Toast from '../../../components/Toast';
import { Package, Truck, CheckCircle, Clock, ChevronDown } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!session) { router.push('/'); return; }

      const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      
      if (clientData && clientData.length > 0 && isMounted) {
        setClientOrg(clientData[0]);
        
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_phone', clientData[0].contact_phone)
          .order('created_at', { ascending: false });
        setOrders(ordersData || []);
      }

      const savedCart = localStorage.getItem('pyro_cart');
      if (savedCart && isMounted) {
        const cart = JSON.parse(savedCart);
        setCartCount(Object.values(cart).reduce((a: number, b: any) => a + Number(b), 0));
      }
      const savedFav = localStorage.getItem('pyro_favorites');
      if (savedFav && isMounted) setFavoritesCount(JSON.parse(savedFav).length);

      if (isMounted) setLoading(false);
    }
    loadData();

    return () => { isMounted = false; };
  }, []);

  const getDeliveryName = (code: string) => {
    switch (code) {
      case 'pickup': return 'Самовывоз';
      case 'seller': return 'Доставка продавца';
      case 'yandex': return 'Яндекс Доставка';
      case 'dostavista': return 'Достависта';
      default: return code || '—';
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  const activeOrders = orders.filter(o => o.delivery_status !== 'Доставлен' && o.delivery_status !== 'Отменен' && o.delivery_status !== 'Отгружен');
  const completedOrders = orders.filter(o => o.delivery_status === 'Доставлен' || o.delivery_status === 'Отменен' || o.delivery_status === 'Отгружен');

  const currentOrders = activeTab === 'active' ? activeOrders : completedOrders;

  const OrderTracker = ({ order }: { order: any }) => {
    const isPickup = order.delivery_method === 'pickup';
    const status = order.delivery_status || 'Ожидает оплаты';

    const deliverySteps = ['Ожидает оплаты', 'На сборке', 'В пути', 'Доставлен'];
    const pickupSteps = ['Ожидает оплаты', 'На сборке', 'Собран', 'Отгружен'];
    
    const steps = isPickup ? pickupSteps : deliverySteps;
    const currentIndex = steps.indexOf(status);

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
          <div 
            className="absolute top-4 left-0 h-1 bg-[#5FC36C] rounded-full transition-all duration-500 -z-10" 
            style={{ width: `${currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0}%` }}
          ></div>

          {steps.map((step, idx) => (
            <div key={step} className="flex flex-col items-center bg-white px-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                idx <= currentIndex ? 'bg-[#5FC36C] border-[#5FC36C] text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {idx === 0 && <Clock className="w-4 h-4" />}
                {idx === 1 && <Package className="w-4 h-4" />}
                {idx === 2 && (isPickup ? <CheckCircle className="w-4 h-4" /> : <Truck className="w-4 h-4" />)}
                {idx === 3 && <CheckCircle className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-bold mt-1 text-center ${idx <= currentIndex ? 'text-black' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />
      
      <div className="flex-grow max-w-4xl mx-auto px-6 mt-8 pb-20 w-full">
        <h1 className="text-3xl font-black mb-8">Заказы</h1>
        
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button onClick={() => setActiveTab('active')} className={`pb-4 px-2 font-bold text-lg transition-all border-b-4 ${activeTab === 'active' ? 'border-[#5FC36C] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Актуальные
          </button>
          <button onClick={() => setActiveTab('completed')} className={`pb-4 px-2 font-bold text-lg transition-all border-b-4 ${activeTab === 'completed' ? 'border-[#5FC36C] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Завершенные
          </button>
        </div>

        {currentOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium text-lg mb-6">
              {activeTab === 'active' ? 'У вас пока нет актуальных заказов' : 'У вас пока нет завершенных заказов'}
            </p>
            <Link href="/shop" className="inline-block bg-[#5FC36C] text-white px-8 py-3 rounded-xl font-black hover:bg-[#4CAF50] transition-colors">
              К покупкам
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {currentOrders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                  <div>
                    <p className="font-black text-lg">Заказ № {order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-black text-xl">{order.total_price} ₽</p>
                    <span className="text-xs font-bold text-gray-500">{order.payment_method}</span>
                  </div>
                </div>

                <OrderTracker order={order} />

                <button 
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="mt-4 flex items-center gap-1 text-sm font-bold text-[#5FC36C] hover:text-[#4CAF50]"
                >
                  {expandedOrder === order.id ? 'Скрыть детали' : 'Показать детали'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                </button>

                {expandedOrder === order.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-2">
                    <p><span className="font-bold text-black">Способ доставки:</span> {getDeliveryName(order.delivery_method)}</p>
                    <p><span className="font-bold text-black">Адрес:</span> {order.delivery_address || '—'}</p>
                    <p><span className="font-bold text-black">Статус:</span> {order.delivery_status || '—'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}