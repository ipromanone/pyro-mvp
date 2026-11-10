'use client';

import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';

export default function InvoiceTemplate({ data, onClose }: { data: any, onClose: () => void }) {
  const [qrCode, setQrCode] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Безопасное извлечение данных
  const adminOrg = data?.adminOrg || {};
  const clientOrg = data?.clientOrg || {};
  const items = data?.items || [];
  const total = data?.total || 0;
  const invoiceNumber = data?.invoiceNumber || '—';
  const date = data?.date || '—';
  const totalWords = data?.totalWords || '—';

  // Банковские реквизиты
  const bankName = adminOrg.bank_name || '—';
  const bankBik = adminOrg.bik || '—';
  const bankAccount = adminOrg.account || '—';
  const bankCorrAccount = adminOrg.corr_account || '—';
  
  // Налоги
  const isVatPayer = clientOrg.is_vat_payer || false;
  const vatRate = 0.22; // НДС 2026
  const vatAmount = isVatPayer ? (total * vatRate) / (1 + vatRate) : 0;

  // Подписант
  const signerName = clientOrg.entity_type === 'ooo' 
    ? (clientOrg.director_name || '—') 
    : (clientOrg.name || '—');

  useEffect(() => {
    const qrText = `ST00012|Name=${adminOrg.name || ''}|PersonalAcc=${bankAccount}|BankName=${bankName}|BIC=${bankBik}|CorrespAcc=${bankCorrAccount}|PayeeINN=${adminOrg.inn || ''}|KPP=${adminOrg.kpp || ''}|Purpose=Оплата по счету ${invoiceNumber}|Sum=${total * 100}`;
    QRCode.toDataURL(qrText, { width: 150, margin: 1 }).then(setQrCode);
  }, [adminOrg, invoiceNumber, total, bankAccount, bankName, bankBik, bankCorrAccount]);

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    try {
      // ДИНАМИЧЕСКИЙ ИМПОРТ
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const element = invoiceRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Счет_${invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Ошибка при генерации PDF:', error);
      alert('Не удалось создать PDF. Проверьте консоль.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white p-4 rounded-xl shadow-2xl max-w-4xl w-full my-8">
        
        <div ref={invoiceRef} className="bg-white p-8 w-[800px] text-black font-sans text-[11px] mx-auto border border-gray-400">
          
          {/* ШАПКА СЧЕТА */}
          <div className="flex border border-black">
            <div className="w-[120px] border-r border-black flex flex-col items-center justify-center p-2">
              {qrCode && <img src={qrCode} alt="QR" className="w-[80px] h-[80px]" />}
              <p className="text-[7px] text-center mt-1 leading-tight">Отсканируйте для оплаты в приложении банка</p>
            </div>

            <div className="flex-grow flex flex-col text-[10px]">
              <div className="border-b border-black p-1 flex justify-between">
                <span>{bankName}</span>
                <span>БИК {bankBik}</span>
              </div>
              <div className="border-b border-black p-1 flex justify-between">
                <span>Банк получателя</span>
                <span>Сч. № {bankCorrAccount}</span>
              </div>
              <div className="border-b border-black p-1 flex justify-between">
                <span>ИНН {adminOrg.inn || '—'} | КПП {adminOrg.kpp || '—'}</span>
                <span>Сч. № {bankAccount}</span>
              </div>
              <div className="p-1 font-bold">
                Получатель: {adminOrg.name || '—'}
              </div>
            </div>
          </div>

          {/* НАЗНАЧЕНИЕ ПЛАТЕЖА */}
          <div className="mt-2 text-[10px] border-b border-black pb-1">
            <span className="font-bold">Назначение платежа:</span> Оплата по реализации товаров и услуг № {invoiceNumber}
          </div>

          {/* ЗАГОЛОВОК */}
          <h1 className="text-[16px] font-bold mt-4 mb-2">Счет на оплату № {invoiceNumber} от {date}</h1>
          
          {/* ПОСТАВЩИК И ПОКУПАТЕЛЬ */}
          <div className="mt-2 text-[10px] space-y-1">
            <div className="flex">
              <span className="font-bold w-[80px] shrink-0">Поставщик:</span> 
              <span>{adminOrg.name || '—'}, ИНН {adminOrg.inn || '—'}, КПП {adminOrg.kpp || '—'}, {adminOrg.address || '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-[80px] shrink-0">Получатель:</span> 
              <span>{clientOrg.name || '—'}, ИНН {clientOrg.inn || '—'}, КПП {clientOrg.kpp || '—'}, {clientOrg.address || '—'}, тел: {clientOrg.contact_phone || '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-[80px] shrink-0">Договор:</span> 
              <span>{clientOrg.contract_number ? `${clientOrg.contract_number} от ${clientOrg.contract_date}` : '—'}</span>
            </div>
          </div>

          {/* ТАБЛИЦА ТОВАРОВ */}
          <table className="w-full mt-4 border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-center w-[30px]">№</th>
                <th className="border border-black p-1 text-left">Товары (работы, услуги)</th>
                <th className="border border-black p-1 text-center w-[50px]">Количество</th>
                <th className="border border-black p-1 text-right w-[70px]">Цена</th>
                <th className="border border-black p-1 text-center w-[50px]">Ставка НДС</th>
                <th className="border border-black p-1 text-right w-[60px]">Сумма НДС</th>
                <th className="border border-black p-1 text-right w-[70px]">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => {
                const itemTotal = item.price * item.quantity;
                const itemVat = isVatPayer ? (itemTotal * vatRate) / (1 + vatRate) : 0;
                return (
                  <tr key={idx}>
                    <td className="border border-black p-1 text-center">{idx + 1}</td>
                    <td className="border border-black p-1">{item.name}</td>
                    <td className="border border-black p-1 text-center">{item.quantity}</td>
                    <td className="border border-black p-1 text-right">{item.price.toFixed(2)}</td>
                    <td className="border border-black p-1 text-center">{isVatPayer ? `${(vatRate * 100).toFixed(0)}%` : 'Без НДС'}</td>
                    <td className="border border-black p-1 text-right">{isVatPayer ? itemVat.toFixed(2) : '—'}</td>
                    <td className="border border-black p-1 text-right">{itemTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ИТОГИ */}
          <div className="mt-2 text-[10px] flex flex-col items-end font-bold space-y-1">
            <div>Итого: {total.toFixed(2)}</div>
            <div>В т.ч. НДС: {isVatPayer ? vatAmount.toFixed(2) : '0.00'}</div>
            <div>Итого с НДС: {total.toFixed(2)}</div>
          </div>

          <div className="mt-2 text-[10px]">
            <p>Всего наименований {items.length} на сумму {total.toFixed(2)} RUB</p>
            <p className="font-bold">{totalWords}</p>
          </div>

          {/* ПОДПИСИ */}
          <div className="mt-10 flex justify-between text-[10px]">
            <div className="w-1/2">
              <div className="font-bold">Руководитель</div>
              <div className="flex items-end mt-4">
                <span className="mr-2">{signerName}</span>
                <div className="border-b border-black w-[150px]"></div>
              </div>
              <div className="text-[9px] mt-1">подпись</div>
            </div>
            
            <div className="w-1/2">
              <div className="font-bold">Главный бухгалтер</div>
              <div className="flex items-end mt-4">
                <span className="mr-2">{adminOrg.accountant || adminOrg.director || '—'}</span>
                <div className="border-b border-black w-[150px]"></div>
              </div>
              <div className="text-[9px] mt-1">подпись</div>
            </div>
          </div>

        </div>

        {/* Кнопки управления */}
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-300">
            Закрыть
          </button>
          <button onClick={handleDownload} className="px-6 py-2 bg-[#4A9EDE] text-white rounded-xl font-bold hover:bg-[#3b8ecc] shadow-md flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Скачать PDF
          </button>
        </div>
      </div>
    </div>
  );
}