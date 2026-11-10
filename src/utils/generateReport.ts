import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './fonts/Roboto';

export const generateReportPDF = (
  clientOrg: any,
  adminOrg: any,
  orders: any[],
  dateFrom: string,
  dateTo: string
) => {
  const doc = new jsPDF();
  doc.setFont('Roboto', 'normal');

  // --- ШАПКА ---
  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.text(`Отчет по закупкам`, 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text(`Период: с ${dateFrom} по ${dateTo}`, 14, 30);
  doc.text(`Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, 190, 30, { align: 'right' });

  // Данные сторон
  doc.text(`Поставщик: ${adminOrg?.name || '—'} (ИНН: ${adminOrg?.inn || '—'})`, 14, 40);
  doc.text(`Покупатель: ${clientOrg?.name || '—'} (ИНН: ${clientOrg?.inn || '—'})`, 14, 46);

  // --- ТАБЛИЦА ---
  // Подготовка данных для таблицы
  const tableData = orders.flatMap(order => {
    // Предполагаем, что в order есть массив items (позиции)
    // Если нет, нужно будет подгружать отдельно. Для простоты покажем сумму заказа.
    return [[
      order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : '—',
      order.id.slice(0, 8),
      order.total_price,
      order.payment_method || '—'
    ]];
  });

  autoTable(doc, {
    startY: 55,
    head: [['Дата', '№ Заказа', 'Сумма (₽)', 'Оплата']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'Roboto', fontSize: 9 },
    headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  });

  // --- ИТОГИ ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalSum = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);

  doc.setFontSize(12);
  doc.setFont('Roboto', 'bold');
  doc.text(`Итого за период: ${totalSum.toFixed(2)} ₽`, 14, finalY);
  
  doc.setFontSize(9);
  doc.setFont('Roboto', 'normal');
  doc.text(`Всего заказов: ${orders.length}`, 14, finalY + 7);

  // Подписи
  const signY = finalY + 25;
  doc.text(`Поставщик: _________________ / ${adminOrg?.director || adminOrg?.name || '—'} /`, 14, signY);
  doc.text(`Покупатель: _________________ / ${clientOrg?.director_name || clientOrg?.name || '—'} /`, 14, signY + 10);

  return doc;
};