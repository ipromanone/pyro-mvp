'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
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
        const { data: ordersData } = await supabase.from('orders').select('*').eq('customer_phone', clientData[0].contact_phone).order('created_at', { ascending: false });
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
          <div className="absolute top-4 left-0 h-1 bg-[#5FC36C] rounded-full transition-all duration-500 -z-10" style={{ width: `${currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0}%` }}></div>
          {steps.map((step, idx) => (
            <div key={step} className="flex flex-col items-center bg-white px-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${idx <= currentIndex ? 'bg-[#5FC36C] border-[#5FC36C] text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                {idx === 0 && <Clock className="w-4 h-4" />}
                {idx === 1 && <Package className="w-4 h-4" />}
                {idx === 2 && (isPickup ? <CheckCircle className="w-4 h-4" /> : <Truck className="w-4 h-4" />)}
                {idx === 3 && <CheckCircle className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-bold mt-1 text-center ${idx <= currentIndex ? 'text-black' : 'text-gray-400'}`}>{step}</span>
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
        {/* ... (Список заказов, он не меняется) ... */}
      </div>
    </div>
  );
}