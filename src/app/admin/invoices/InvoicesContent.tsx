'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Toast from '../../../components/Toast';
import InvoiceTemplate from '../../../components/InvoiceTemplate';
import { numberToWords } from '../../../utils/generateInvoice';
import { Eye, CheckCircle2, FileText, Search, User } from 'lucide-react';

export default function InvoicesContent() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, any>>({}); // Словарь клиентов по user_id
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);
  const [adminOrg, setAdminOrg] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);

    // 1. Загружаем счета
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    setInvoices(invoicesData || []);

    // 2. Загружаем клиентов (организации) и делаем из них словарь для быстрого поиска
    const { data: clientsData } = await supabase
      .from('organizations')
      .select('*');
    
    if (clientsData) {
      const clientsMap: Record<string, any> = {};
      clientsData.forEach(c => {
        if (c.user_id) clientsMap[c.user_id] = c;
      });
      setClients(clientsMap);
    }

    // 3. Загружаем реквизиты админской организации
    const { data: adminData } = await supabase
      .from('admin_organizations')
      .select('*')
      .eq('is_default', true)
      .single();
    setAdminOrg(adminData);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const markAsPaid = async (id: string) => {
    await supabase.from('invoices').update({ status: 'Оплачен' }).eq('id', id);
    setToast({ message: 'Статус обновлен на "Оплачен"', type: 'success' });
    fetchData();
  };

  const handleOpenInvoice = async (invoice: any) => {
    if (!adminOrg) {
      setToast({ message: 'Реквизиты вашей организации не настроены', type: 'error' });
      return;
    }

    // Получаем клиента для этого счета
    const clientOrg = clients[invoice.user_id] || { name: 'Неизвестный клиент' };

    // Подгружаем позиции заказа
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
      clientOrg: clientOrg,
      items: itemsForPdf,
      total: invoice.amount,
      totalWords: numberToWords(invoice.amount)
    });
    
    setShowInvoiceModal(true);
  };

  const filteredInvoices = invoices.filter(inv => {
    const clientName = clients[inv.user_id]?.name || '';
    
    const matchFilter = filter === 'pending' ? inv.status === 'Ожидает оплаты' : 
                        filter === 'paid' ? inv.status === 'Оплачен' : true;
    
    const matchSearch = search ? (
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) || 
      clientName.toLowerCase().includes(search.toLowerCase())
    ) : true;

    return matchFilter && matchSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-transparent">Загрузка...</div>;

  return (
    <div className="font-sans text-[#1A1A1A] pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {showInvoiceModal && selectedInvoiceData && (
        <InvoiceTemplate 
          data={selectedInvoiceData} 
          onClose={() => setShowInvoiceModal(false)} 
        />
      )}

      <main className="mt-2">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'all' ? 'bg-[#5FC36C] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>Все счета</button>
            <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'pending' ? 'bg-[#5FC36C] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>Ждут оплаты</button>
            <button onClick={() => setFilter('paid')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'paid' ? 'bg-[#5FC36C] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>Оплаченные</button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Поиск по номеру или клиенту..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-12 pr-4 font-medium focus:outline-none focus:border-[#5FC36C] focus:ring-1 focus:ring-[#5FC36C] transition-all text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Счет №</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Сумма</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-gray-900">{inv.invoice_number}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{clients[inv.user_id]?.name || 'Неизвестный клиент'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.created_at).toLocaleDateString('ru-RU')}</td>
                    <td className="px-6 py-4 font-black text-gray-900">{inv.amount} ₽</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${inv.status === 'Ожидает оплаты' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenInvoice(inv)}
                          className="p-2 text-gray-400 hover:text-[#5FC36C] hover:bg-green-50 rounded-lg transition-colors" 
                          title="Открыть счет"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {inv.status === 'Ожидает оплаты' && (
                          <button 
                            onClick={() => markAsPaid(inv.id)} 
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
                            title="Отметить оплаченным"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Оплачен
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-lg font-bold text-gray-900">Счетов не найдено</p>
                        <p className="text-gray-500">Попробуйте изменить фильтр или поиск.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}