'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Toast from '../../../../components/Toast';
import InvoiceTemplate from '../../../../components/InvoiceTemplate';
import { numberToWords } from '../../../../utils/generateInvoice';
import { ArrowLeft, Trash2, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

export default function OrderDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [adminOrg, setAdminOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const { data: orderData } = await supabase.from('orders').select('*').eq('id', id).single();
    setOrder(orderData);

    if (orderData) {
      const { data: itemsData } = await supabase.from('order_items').select('*, products(name)').eq('order_id', id);
      setItems(itemsData || []);
      const { data: clientData } = await supabase.from('organizations').select('*').eq('contact_phone', orderData.customer_phone).limit(1);
      if (clientData && clientData.length > 0) setClientOrg(clientData[0]);
    }

    const { data: adminData } = await supabase.from('admin_organizations').select('*').eq('is_default', true).single();
    setAdminOrg(adminData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from('orders').update({ delivery_status: newStatus }).eq('id', id);
    if (error) setToast({ message: 'Ошибка обновления статуса', type: 'error' });
    else {
      setOrder({ ...order, delivery_status: newStatus });
      setToast({ message: 'Статус обновлен', type: 'success' });
    }
  };

  const confirmDelete = async () => {
    await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      setToast({ message: 'Ошибка удаления', type: 'error' });
      setShowDeleteModal(false);
    } else {
      setToast({ message: 'Заказ удален', type: 'success' });
      setShowDeleteModal(false);
      setTimeout(() => router.push('/admin'), 1000);
    }
  };

  const handleOpenInvoice = () => {
    if (!clientOrg || !adminOrg || !order) return;
    const itemsForPdf = items.map(item => ({
      name: item.products?.name || 'Товар',
      quantity: item.quantity,
      price: item.price
    }));
    setInvoiceData({
      invoiceNumber: `СЧ-${order.id.slice(0, 4)}`,
      date: new Date(order.created_at).toLocaleDateString('ru-RU'),
      adminOrg,
      clientOrg,
      items: itemsForPdf,
      total: order.total_price,
      totalWords: numberToWords(order.total_price)
    });
    setShowInvoiceModal(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Заказ не найден</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black mb-2">Удалить заказ?</h2>
            <p className="text-gray-500 text-sm mb-6">Вы действительно хотите удалить заказ клиента? Это действие нельзя отменить.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Отмена</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors">Удалить</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4" /> Назад к заказам
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black">Заказ #{order.id.slice(0, 8)}</h1>
            <button onClick={fetchData} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200" title="Обновить">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black mb-4">Информация о заказе</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 font-bold uppercase text-xs mb-1">Клиент</p>
              <p className="font-bold">{order.customer_name}</p>
              <p>{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-xs mb-1">Оплата</p>
              <p className="font-bold">{order.payment_method}</p>
              <p className="font-black text-lg mt-1">{order.total_price} ₽</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-xs mb-1">Доставка</p>
              <p className="font-bold">{order.delivery_method}</p>
              <p>{order.delivery_address || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-xs mb-1">Дата</p>
              <p>{new Date(order.created_at).toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black mb-4">Состав заказа</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 text-sm text-gray-500">Товар</th>
                <th className="py-2 text-sm text-gray-500 text-center">Кол-во</th>
                <th className="py-2 text-sm text-gray-500 text-right">Цена</th>
                <th className="py-2 text-sm text-gray-500 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-sm">{item.products?.name || 'Товар'}</td>
                  <td className="py-3 text-center text-sm">{item.quantity}</td>
                  <td className="py-3 text-right text-sm">{item.price} ₽</td>
                  <td className="py-3 text-right font-bold text-sm">{item.price * item.quantity} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black mb-4">Управление</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="font-bold text-sm">Статус:</label>
              <select value={order.delivery_status || ''} onChange={(e) => updateStatus(e.target.value)} className="bg-[#F3F4F6] border-none rounded-xl px-4 py-2 font-bold text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none">
                <option value="Ожидает оплаты">Ожидает оплаты</option>
                <option value="На сборке">На сборке</option>
                <option value="В пути">В пути</option>
                <option value="Доставлен">Доставлен</option>
                <option value="Собран">Собран (для самовывоза)</option>
                <option value="Отгружен">Отгружен (для самовывоза)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleOpenInvoice} className="flex items-center gap-2 bg-[#E3F2E3] text-[#5FC36C] px-4 py-2 rounded-xl font-bold hover:bg-[#d0ebd0] transition-colors">
                <FileText className="w-4 h-4" /> Счет
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4" /> Удалить
              </button>
            </div>
          </div>
        </div>
      </main>

      {showInvoiceModal && invoiceData && (
        <InvoiceTemplate data={invoiceData} onClose={() => setShowInvoiceModal(false)} />
      )}
    </div>
  );
}