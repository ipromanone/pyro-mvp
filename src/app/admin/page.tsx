'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Toast from '../../components/Toast';
import AdminChatPanel from '../../components/AdminChatPanel';
import ClientsContent from './clients/ClientsContent';
import InvoicesContent from './invoices/InvoicesContent';
import StoreContent from './store/StoreContent';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, FileText, 
  MessageSquare, Settings, LogOut, Search, Plus, Upload, 
  TrendingUp, AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react';

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'clients' | 'invoices' | 'chat' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Данные для дашборда
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, pending: 0, lowStock: 0 });

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    
    const [ordersRes, productsRes, clientsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*'),
      supabase.from('organizations').select('*')
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);
    if (productsRes.data) {
      setProducts(productsRes.data);
      setStats(prev => ({ ...prev, lowStock: productsRes.data.filter((p: any) => p.stock < 10).length }));
    }
    if (clientsRes.data) setClients(clientsRes.data);

    if (ordersRes.data) {
      const revenue = ordersRes.data
        .filter((o: any) => o.payment_status === 'Оплачен' || o.status === 'отправлен')
        .reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
      const pending = ordersRes.data.filter((o: any) => o.status === 'новый').length;
      setStats(prev => ({ ...prev, revenue, pending }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ОБРАБОТЧИК КНОПКИ "ОБНОВИТЬ"
  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    setToast({ message: 'Обновление данных...', type: 'info' });
    
    await fetchData(false); // false означает, что не показываем большой спиннер загрузки

    setToast({ message: 'Данные успешно обновлены!', type: 'success' });
    setIsRefreshing(false);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'orders', label: 'Заказы', icon: ShoppingCart },
    { id: 'products', label: 'Товары (Склад)', icon: Package },
    { id: 'clients', label: 'Клиенты (CRM)', icon: Users },
    { id: 'invoices', label: 'Счета', icon: FileText },
    { id: 'chat', label: 'Чат с клиентами', icon: MessageSquare },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  if (loading && orders.length === 0) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка админки...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans flex">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* БОКОВОЕ МЕНЮ */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-20 shadow-sm shrink-0">
        <div className="p-6 border-b border-gray-100">
          <Link href="/shop" className="text-3xl font-black tracking-tighter text-black">
            Pyro<span className="text-[#5FC36C]">.</span> Admin
          </Link>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-[#5FC36C] text-white shadow-md shadow-green-500/20' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => router.push('/shop')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
            <LogOut className="w-5 h-5" />
            Выйти в магазин
          </button>
        </div>
      </aside>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="flex-grow p-8 overflow-y-auto">
        
        {/* ШАПКА */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-gray-500 font-medium mt-1">Управление магазином Pyro</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRefreshClick} 
              disabled={isRefreshing}
              className={`p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`} 
              title="Обновить данные"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-10 h-10 bg-[#5FC36C] rounded-full flex items-center justify-center text-white font-black">
              А
            </div>
          </div>
        </header>

        {/* --- ДАШБОРД --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 rounded-xl"><TrendingUp className="w-6 h-6 text-[#5FC36C]" /></div>
                </div>
                <p className="text-sm font-bold text-gray-500 mb-1">Выручка (оплачено)</p>
                <p className="text-3xl font-black text-gray-900">{stats.revenue.toLocaleString()} ₽</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl"><ShoppingCart className="w-6 h-6 text-blue-500" /></div>
                </div>
                <p className="text-sm font-bold text-gray-500 mb-1">Новые заказы</p>
                <p className="text-3xl font-black text-gray-900">{stats.pending}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-yellow-50 rounded-xl"><AlertCircle className="w-6 h-6 text-yellow-500" /></div>
                </div>
                <p className="text-sm font-bold text-gray-500 mb-1">Мало на складе</p>
                <p className="text-3xl font-black text-gray-900">{stats.lowStock} <span className="text-base font-bold text-gray-400">товаров</span></p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl"><Users className="w-6 h-6 text-purple-500" /></div>
                </div>
                <p className="text-sm font-bold text-gray-500 mb-1">Всего клиентов</p>
                <p className="text-3xl font-black text-gray-900">{clients.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black">Последние заказы</h2>
                <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-[#5FC36C] hover:underline">Все заказы →</button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">№ / Дата</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Клиент</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Сумма</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Статус</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">#{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">{order.customer_name}</td>
                      <td className="px-6 py-4 font-black">{order.total_price} ₽</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                          order.status === 'новый' ? 'bg-blue-100 text-blue-700' : 
                          order.status === 'отправлен' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/orders/${order.id}`} className="text-[#5FC36C] font-bold text-sm hover:underline">Открыть</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ЗАКАЗЫ --- */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black">Все заказы</h2>
              <span className="text-sm font-bold text-gray-500">Всего: {orders.length}</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Заказ</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Клиент</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Сумма</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm">#{order.id.slice(0, 6)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('ru-RU')}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm">{order.customer_name}</td>
                    <td className="px-6 py-4 font-black">{order.total_price} ₽</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-md text-xs font-bold bg-gray-100">{order.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="text-[#5FC36C] font-bold text-sm hover:underline">Подробнее →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- ТОВАРЫ --- */}
        {/* --- ТОВАРЫ --- */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <StoreContent />
          </div>
        )}

        {/* --- КЛИЕНТЫ --- */}
        {activeTab === 'clients' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <ClientsContent />
          </div>
        )}

        {/* --- СЧЕТА --- */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <InvoicesContent />
          </div>
        )}

        {/* --- ЧАТ --- */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 h-[700px]">
            <AdminChatPanel />
          </div>
        )}

        {/* --- НАСТРОЙКИ --- */}
        {activeTab === 'settings' && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Настройки организации</h2>
            <p className="text-gray-500 font-medium mb-6">Управление реквизитами и организациями.</p>
            <Link href="/admin/settings" className="inline-flex items-center gap-2 bg-[#5FC36C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors">
              Перейти в настройки <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}