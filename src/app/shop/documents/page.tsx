'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ShopHeader from '../../../components/ShopHeader';
import Footer from '../../../components/Footer';
import InvoiceTemplate from '../../../components/InvoiceTemplate';
import { numberToWords } from '../../../utils/generateInvoice';
import { generateContractPDF } from '../../../utils/generateContract';
import { generateReportPDF } from '../../../utils/generateReport';
import CustomDatePicker from '../../../components/CustomDatePicker'; // <--- ИМПОРТ КАЛЕНДАРЯ
import { FileText, FileCheck, PenTool, CheckCircle, X, BarChart, AlertTriangle } from 'lucide-react';
import Toast from '../../../components/Toast';

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'contracts' | 'reports'>('invoices');
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [adminOrg, setAdminOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  
  const [previewContract, setPreviewContract] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [signingContract, setSigningContract] = useState<any>(null);
  
  // Состояния для отчетов
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportOrders, setReportOrders] = useState<any[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      if (clientData && clientData.length > 0) {
        setClientOrg(clientData[0]);
        
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        setInvoices(invoicesData || []);

        const { data: contractsData } = await supabase
          .from('contracts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        setContracts(contractsData || []);
      }

      const { data: adminData } = await supabase.from('admin_organizations').select('*').eq('is_default', true).single();
      setAdminOrg(adminData);

      const savedCart = localStorage.getItem('pyro_cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(Object.values(cart).reduce((a: number, b: any) => a + Number(b), 0));
      }
      const savedFav = localStorage.getItem('pyro_favorites');
      if (savedFav) setFavoritesCount(JSON.parse(savedFav).length);

      setLoading(false);
    }
    init();
  }, [router]);

  const handleOpenInvoice = async (invoice: any) => {
    if (!clientOrg || !adminOrg) return;
    
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

    setInvoiceData({
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

  const handleSignContract = async () => {
    if (!signingContract) return;

    const { error } = await supabase.from('contracts').update({
      is_signed: true,
      signed_at: new Date().toISOString()
    }).eq('id', signingContract.id);

    if (error) {
      setToast({ message: 'Ошибка подписания: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Договор подписан простой электронной подписью', type: 'success' });
      setContracts(prev => prev.map(c => c.id === signingContract.id ? { ...c, is_signed: true, signed_at: new Date().toISOString() } : c));
      setSigningContract(null);
    }
  };

  const handlePreviewContract = (contract: any) => {
    if (!clientOrg || !adminOrg) {
      setToast({ message: 'Ошибка: не хватает данных для договора', type: 'error' });
      return;
    }
    const doc = generateContractPDF(contract.contract_number, contract.contract_date, clientOrg, adminOrg);
    if (doc) {
      const url = doc.output('bloburl').toString();
      setPreviewUrl(url);
      setPreviewContract(contract);
    }
  };

  const handleDownloadContract = (contract: any) => {
    if (!clientOrg || !adminOrg) {
      setToast({ message: 'Ошибка: не хватает данных для договора', type: 'error' });
      return;
    }
    const doc = generateContractPDF(contract.contract_number, contract.contract_date, clientOrg, adminOrg);
    if (doc) {
      doc.save(`Договор_${contract.contract_number}.pdf`);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportDateFrom || !reportDateTo) {
      setToast({ message: 'Выберите период', type: 'error' });
      return;
    }
    setIsGeneratingReport(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', clientOrg?.contact_phone)
      .gte('created_at', reportDateFrom)
      .lte('created_at', reportDateTo)
      .order('created_at', { ascending: true });

    if (error) {
      setToast({ message: 'Ошибка загрузки заказов: ' + error.message, type: 'error' });
    } else {
      setReportOrders(data || []);
      if (data && data.length > 0) {
        setToast({ message: 'Отчет сформирован', type: 'success' });
      } else {
        setToast({ message: 'За выбранный период заказов нет', type: 'info' });
      }
    }
    setIsGeneratingReport(false);
  };

  const handleDownloadReport = () => {
    if (!clientOrg || !adminOrg || reportOrders.length === 0) return;
    const doc = generateReportPDF(clientOrg, adminOrg, reportOrders, reportDateFrom, reportDateTo);
    doc.save(`Отчет_${reportDateFrom}_${reportDateTo}.pdf`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка...</div>;

  const isPhoneMissing = !clientOrg?.contact_phone;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />

      <div className="flex-grow max-w-4xl mx-auto px-6 mt-8 pb-20 w-full">
        <h1 className="text-3xl font-black mb-8">Мои документы</h1>

        <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
          <button onClick={() => setActiveTab('invoices')} className={`pb-4 px-2 font-bold text-lg transition-all border-b-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'invoices' ? 'border-[#5FC36C] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <FileText className="w-5 h-5" /> Счета
          </button>
          <button onClick={() => setActiveTab('contracts')} className={`pb-4 px-2 font-bold text-lg transition-all border-b-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'contracts' ? 'border-[#5FC36C] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <FileCheck className="w-5 h-5" /> Договоры
          </button>
          <button onClick={() => setActiveTab('reports')} className={`pb-4 px-2 font-bold text-lg transition-all border-b-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'reports' ? 'border-[#5FC36C] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <BarChart className="w-5 h-5" /> Отчеты
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">У вас пока нет счетов.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 font-bold text-sm text-gray-500">Счет №</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500">Дата</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500">Сумма</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500">Статус</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-sm">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.created_at).toLocaleDateString('ru-RU')}</td>
                      <td className="px-6 py-4 font-black">{inv.amount} ₽</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${inv.status === 'Ожидает оплаты' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center">
                        <button onClick={() => handleOpenInvoice(inv)} className="flex items-center gap-2 text-[#5FC36C] font-bold hover:text-[#4CAF50] bg-[#E3F2E3] px-4 py-2 rounded-lg transition-colors">
                          <FileText className="w-4 h-4" /> Открыть
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            {contracts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">У вас пока нет договоров.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 font-bold text-sm text-gray-500">Документ</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500">Дата</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500">Статус</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-sm">
                        {contract.contract_type} № {contract.contract_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{contract.contract_date}</td>
                      <td className="px-6 py-4">
                        {contract.is_signed ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md w-fit">
                            <CheckCircle className="w-3 h-3" /> Подписан
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md">Не подписан</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button onClick={() => handlePreviewContract(contract)} className="flex items-center gap-2 text-gray-600 font-bold hover:text-black bg-gray-100 px-4 py-2 rounded-lg transition-colors">
                          <FileText className="w-4 h-4" /> Открыть
                        </button>
                        {!contract.is_signed && (
                          <button onClick={() => setSigningContract(contract)} className="flex items-center gap-2 text-[#5FC36C] font-bold hover:text-[#4CAF50] bg-[#E3F2E3] px-4 py-2 rounded-lg transition-colors">
                            <PenTool className="w-4 h-4" /> Подписать
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-4">Отчет по закупкам</h2>
            <p className="text-sm text-gray-500 mb-6">Выберите период, чтобы сформировать отчет о ваших заказах.</p>

            {isPhoneMissing && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-8">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <p className="font-bold text-red-800">Не заполнен контактный телефон</p>
                  <p className="text-sm text-red-700 font-medium">
                    Для формирования отчета необходим ваш номер телефона (он используется для поиска заказов). 
                    <Link href="/shop/settings" className="underline font-bold ml-1">Заполните его в настройках</Link>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-end mb-8">
              <div className="flex-grow">
                <label className="block text-sm font-bold mb-2">Дата с</label>
                {/* ЗАМЕНЕН ИНПУТ НА КАСТОМНЫЙ КАЛЕНДАРЬ */}
                <CustomDatePicker value={reportDateFrom} onChange={setReportDateFrom} placeholder="Дата с" />
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-bold mb-2">Дата по</label>
                {/* ЗАМЕНЕН ИНПУТ НА КАСТОМНЫЙ КАЛЕНДАРЬ */}
                <CustomDatePicker value={reportDateTo} onChange={setReportDateTo} placeholder="Дата по" />
              </div>
              <button 
                onClick={handleGenerateReport} 
                disabled={isGeneratingReport || isPhoneMissing}
                className="bg-[#5FC36C] text-white px-6 py-3 rounded-xl font-black hover:bg-[#4CAF50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-[46px]"
                title={isPhoneMissing ? "Заполните телефон в настройках" : ""}
              >
                {isGeneratingReport ? 'Формирование...' : 'Сформировать'}
              </button>
            </div>

            {reportOrders.length > 0 && (
              <div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 font-bold">Найдено заказов</p>
                    <p className="font-black text-lg">{reportOrders.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-bold">Общая сумма</p>
                    <p className="font-black text-lg">{reportOrders.reduce((sum, o) => sum + o.total_price, 0).toFixed(2)} ₽</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 font-bold text-sm text-gray-500">Дата</th>
                        <th className="px-4 py-3 font-bold text-sm text-gray-500">Заказ</th>
                        <th className="px-4 py-3 font-bold text-sm text-gray-500">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-sm">{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                          <td className="px-4 py-3 text-sm">№ {order.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 font-bold">{order.total_price} ₽</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button 
                  onClick={handleDownloadReport} 
                  className="w-full bg-[#4A9EDE] text-white py-4 rounded-xl font-black hover:bg-[#3b8ecc] transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" /> Скачать отчет PDF
                </button>
              </div>
            )}

            {reportOrders.length === 0 && !isGeneratingReport && reportDateFrom && reportDateTo && !isPhoneMissing && (
              <div className="text-center py-12 text-gray-500 font-medium">
                За выбранный период заказов не найдено.
              </div>
            )}
          </div>
        )}
      </div>

      {previewContract && previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black">Предпросмотр договора</h2>
              <button onClick={() => { setPreviewContract(null); setPreviewUrl(null); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 rounded-xl p-4">
              <iframe src={previewUrl} className="w-full h-[600px] border-none" title="Договор" />
            </div>
            <div className="mt-4 flex justify-end gap-4">
              <button onClick={() => { setPreviewContract(null); setPreviewUrl(null); }} className="px-6 py-3 bg-gray-100 text-black rounded-xl font-bold hover:bg-gray-200">Закрыть</button>
              <button onClick={() => handleDownloadContract(previewContract)} className="px-6 py-3 bg-[#4A9EDE] text-white rounded-xl font-bold hover:bg-[#3b8ecc] flex items-center gap-2">
                <FileText className="w-5 h-5" /> Скачать PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {signingContract && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-black mb-4">Подписание договора</h2>
            <p className="text-sm text-gray-600 mb-6">
              Вы собираетесь подписать <b>{signingContract.contract_type} № {signingContract.contract_number}</b> простой электронной подписью. 
              Нажимая «Подписать», вы подтверждаете свое согласие с условиями документа.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setSigningContract(null)} className="flex-1 bg-gray-100 text-black py-3 rounded-xl font-bold hover:bg-gray-200">Отмена</button>
              <button onClick={handleSignContract} className="flex-1 bg-[#5FC36C] text-white py-3 rounded-xl font-black hover:bg-[#4CAF50]">Подписать</button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && invoiceData && (
        <InvoiceTemplate 
          data={invoiceData} 
          onClose={() => setShowInvoiceModal(false)} 
        />
      )}

      
    </div>
  );
}
