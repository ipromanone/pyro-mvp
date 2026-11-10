import { jsPDF } from 'jspdf';
import './fonts/Roboto';

export const generateContractPDF = (
  contractNumber: string,
  contractDate: string,
  clientOrg: any,
  adminOrg: any
) => {
  try {
    const doc = new jsPDF();
    doc.setFont('Roboto', 'normal');

    // Заголовок
    doc.setFontSize(16);
    doc.text(`ДОГОВОР ПОСТАВКИ № ${contractNumber}`, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`г. Москва`, 14, 30);
    doc.text(`${contractDate}`, 190, 30, { align: 'right' });

    let y = 45;

    // Преамбула
    const adminName = adminOrg?.entity_type === 'ip' ? `ИП ${adminOrg.director || adminOrg.name}` : adminOrg?.name;
    const clientName = clientOrg?.entity_type === 'ip' ? `ИП ${clientOrg.director_name || clientOrg.name}` : clientOrg?.name;

    const preamble = `Мы, нижеподписавшиеся, ${adminName} (ИНН: ${adminOrg?.inn || '—'}), именуемый в дальнейшем «Поставщик», с одной стороны, и ${clientName} (ИНН: ${clientOrg?.inn || '—'}), именуемый в дальнейшем «Покупатель», с другой стороны, заключили настоящий договор о нижеследующем:`;
    
    const splitPreamble = doc.splitTextToSize(preamble, 180);
    doc.text(splitPreamble, 14, y);
    y += splitPreamble.length * 5 + 10;

    // Пункты
    const clauses = [
      "1. Предмет договора\nПоставщик обязуется передать Покупателю пиротехническую продукцию, а Покупатель обязуется принять и оплатить товар в порядке и на условиях, предусмотренных настоящим Договором.",
      "2. Сумма договора и порядок расчетов\n2.1. Сумма договора определяется как общая стоимость Товара, заказанного Покупателем в течение срока действия Договора.\n2.2. Оплата производится в безналичном порядке путем перечисления денежных средств на расчетный счет Поставщика или иными способами, не запрещенными законодательством РФ.",
      "3. Срок действия договора\n3.1. Настоящий Договор вступает в силу с момента его подписания и действует до 31 декабря текущего года.",
      "4. Заключительные положения\n4.1. Во всем остальном, что не предусмотрено настоящим Договором, Стороны руководствуются действующим законодательством РФ."
    ];

    clauses.forEach(clause => {
      const split = doc.splitTextToSize(clause, 180);
      doc.text(split, 14, y);
      y += split.length * 5 + 8;
    });

    y += 15;

    // Реквизиты
    doc.setFontSize(11);
    doc.text('Реквизиты и подписи сторон:', 14, y);
    y += 10;

    doc.setFontSize(9);
    
    // Поставщик
    doc.text('Поставщик:', 14, y);
    doc.text(`${adminOrg?.name || '—'}`, 14, y + 5);
    doc.text(`ИНН/КПП: ${adminOrg?.inn || '—'} / ${adminOrg?.kpp || '—'}`, 14, y + 10);
    doc.text(`Адрес: ${adminOrg?.address || '—'}`, 14, y + 15);
    doc.text(`Р/С: ${adminOrg?.account || '—'}`, 14, y + 20);
    doc.text(`Банк: ${adminOrg?.bank_name || '—'}`, 14, y + 25);
    
    // Покупатель
    doc.text('Покупатель:', 110, y);
    doc.text(`${clientOrg?.name || '—'}`, 110, y + 5);
    doc.text(`ИНН/КПП: ${clientOrg?.inn || '—'} / ${clientOrg?.kpp || '—'}`, 110, y + 10);
    doc.text(`Адрес: ${clientOrg?.address || '—'}`, 110, y + 15);
    doc.text(`Р/С: ${clientOrg?.account || '—'}`, 110, y + 20);
    doc.text(`Банк: ${clientOrg?.bank_name || '—'}`, 110, y + 25);

    y += 40;

    // Подписи
    doc.text('Поставщик: _______________', 14, y);
    doc.text('Покупатель: _______________', 110, y);

    // Возвращаем документ
    return doc;
  } catch (error) {
    console.error('Ошибка генерации договора:', error);
    return null;
  }
};