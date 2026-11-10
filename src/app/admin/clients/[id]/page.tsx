'use client';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '../../../supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { generateContractPDF } from '../../../../utils/generateContract';
import { numberToWords } from '../../../../utils/generateInvoice';
import InvoiceTemplate from '../../../../components/InvoiceTemplate';
import Toast from '../../../../components/Toast';

function ClientDetailsContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [client, setClient] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [adminOrg, setAdminOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'contracts' | 'invoices' | 'orders'>('contracts');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      const { data: clientData } = await supabase.from('organizations').select('*').eq('id', id).single();
      setClient(clientData);

      if (clientData) {
        const { data: invoicesData } = await supabase.from('invoices').select('*').eq('user_id', clientData.user_id).order('created_at', { ascending: false });
        setInvoices(invoicesData || []);

        const { data: ordersData } = await supabase.from('orders').select('*').eq('customer_phone', clientData.phone).order('created_at', { ascending: false });
        setOrders(ordersData || []);
      }

      const { data: defaultAdminOrg } = await supabase.from('admin_organizations').select('*').eq('is_default', true).single();
      setAdminOrg(defaultAdminOrg);

      setLoading(false);
    }
    loadData();
  }, [id]);

  const handlePrepareInvoice = async (invoice: any) => {
    if (!client || !adminOrg) return;
    
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', invoice.order_id);

    const itemsForPdf = orderItems && orderItems.length > 0 
      ? orderItems.map((item: any) => ({
          name: item.products?.name || 'Товар',
          quantity: item.quantity,
          price: item.price
        }))
      : [{ name: 'Оплата по счету', quantity: 1, price: invoice.amount }];

    setSelectedInvoiceData({
      invoiceNumber: invoice.invoice_number,
      date: new Date(invoice.created_at).toLocaleDateString('ru-RU'),
      adminOrg: adminOrg,
      clientOrg: client,
      items: itemsForPdf,
      total: invoice.amount,
      totalWords: numberToWords(invoice.amount)
    });
    
    setShowInvoiceModal(true);
  };

  const handleDownloadContract = () => {
    if (!client || !adminOrg) return;
    generateContractPDF(
      client.contract_number || '___',
      client.contract_date || '___',
      client,
      adminOrg
    );
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    await supabase.from('invoices').delete().eq('id', invoiceToDelete);
    setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete));
    setInvoiceToDelete(null);
    setToast({ message: 'Счет удален', type: 'success' });
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    await supabase.from('order_items').delete().eq('order_id', orderToDelete);
    await supabase.from('orders').delete().eq('id', orderToDelete);
    setOrders(orders.filter(o => o.id !== orderToDelete));
    setOrderToDelete(null);
    setToast({ message: 'Заказ удален', type: 'success' });
  };

  const filteredInvoices = invoices.filter(inv => inv.invoice_number.toLowerCase().includes(searchInvoice.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4] text-[#4CAF50] font-bold">Загрузка...</div>;
  if (!client) return <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4] text-[#4CAF50] font-bold">Клиент не найден</div>;

  return (
    <div className="min-h-screen bg-[#F4F9F4] text-[#1A3A2A] font-sans pb-20 relative">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showInvoiceModal && selectedInvoiceData && (
        <InvoiceTemplate 
          data={selectedInvoiceData} 
          onClose={() => setShowInvoiceModal(false)} 
        />
      )}

      {invoiceToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center">
            <h2 className="text-xl font-extrabold mb-2">Удалить счет?</h2>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setInvoiceToDelete(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">Отмена</button>
              <button onClick={confirmDeleteInvoice} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold">Удалить</button>
            </div>
          </div>
        </div>
      )}

      {orderToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center">
            <h2 className="text-xl font-extrabold mb-2">Удалить заказ?</h2>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOrderToDelete(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">Отмена</button>
              <button onClick={confirmDeleteOrder} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold">Удалить</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-[#E3F2E3] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/admin/clients" className="text-sm font-bold bg-[#F4F9F4] px-5 py-2 rounded-full hover:bg-[#E3F2E3]">← К списку клиентов</Link>
          <span className="text-xl font-extrabold text-[#4CAF50]">{client.name}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="bg-white p-6 rounded-[2rem] border border-[#E3F2E3] shadow-sm mb-8 flex flex-wrap gap-8">
          <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">ИНН</p><p className="font-bold">{client.inn || '—'}</p></div>
          <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">ОГРН</p><p className="font-bold">{client.ogrn || '—'}</p></div>
          <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Телефон</p><p className="font-bold">{client.contact_phone || '—'}</p></div>
          <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Договор</p><p className={`font-bold ${client.contract_signed ? 'text-green-500' : 'text-red-500'}`}>{client.contract_signed ? `Подписан` : 'Не подписан'}</p></div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={() => setActiveTab('contracts')} className={`px-6 py-3 font-bold rounded-xl transition-all ${activeTab === 'contracts' ? 'bg-[#4CAF50] text-white shadow-md' : 'bg-white text-gray-500 border border-[#E3F2E3] hover:bg-gray-50'}`}>Договоры</button>
          <button onClick={() => setActiveTab('invoices')} className={`px-6 py-3 font-bold rounded-xl transition-all ${activeTab === 'invoices' ? 'bg-[#4CAF50] text-white shadow-md' : 'bg-white text-gray-500 border border-[#E3F2E3] hover:bg-gray-50'}`}>Счета</button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 font-bold rounded-xl transition-all ${activeTab === 'orders' ? 'bg-[#4CAF50] text-white shadow-md' : 'bg-white text-gray-500 border border-[#E3F2E3] hover:bg-gray-50'}`}>Заказы</button>
        </div>

        {activeTab === 'contracts' && (
          <div className="bg-white rounded-[2rem] border border-[#E3F2E3] shadow-sm overflow-hidden">
            {client.contract_signed ? (
              <div className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">Договор поставки № {client.contract_number}</h3>
                  <p className="text-sm text-gray-500">Дата подписания: {client.contract_date}</p>
                </div>
                <button onClick={handleDownloadContract} className="text-[#4CAF50] hover:text-[#3b8ecc] p-2 bg-[#F4F9F4] rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 font-bold">Договор не подписан</div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-[2rem] border border-[#E3F2E3] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E3F2E3] bg-[#F8FBF8]">
              <input type="text" placeholder="Поиск счета..." value={searchInvoice} onChange={(e) => setSearchInvoice(e.target.value)} className="w-full max-w-md bg-white border-2 border-[#E3F2E3] rounded-xl p-3 text-sm focus:outline-none focus:border-[#4CAF50]" />
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#E3F2E3]">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase">Счет №</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase">Дата</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase">Сумма</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#F8FBF8]">
                    <td className="px-6 py-4 font-bold text-sm">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.created_at).toLocaleDateString('ru-RU')}</td>
                    <td className="px-6 py-4 font-extrabold">{inv.amount} ₽</td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={() => handlePrepareInvoice(inv)} className="text-[#4CAF50] hover:text-[#3b8ecc] p-2 bg-[#F4F9F4] rounded-lg" title="Скачать счет">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      </button>
                      <button onClick={() => setInvoiceToDelete(inv.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2rem] border border-[#E3F2E3] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#E3F2E3]">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase">Дата</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase">Сумма</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase">Оплата</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#F8FBF8]">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                    <td className="px-6 py-4 font-extrabold">{order.total_price} ₽</td>
                    <td className="px-6 py-4 text-sm">{order.payment_method || '—'}</td>
                    <td className="px-6 py-4 flex justify-center">
                      <button onClick={() => setOrderToDelete(order.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ClientDetails() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F9F4] text-[#4CAF50] font-bold">Загрузка...</div>}>
      <ClientDetailsContent />
    </Suspense>
  );
}