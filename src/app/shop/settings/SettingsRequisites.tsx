'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { Loader2, ChevronDown, Check, Pencil, AlertTriangle } from 'lucide-react';

// Компонент красивого выпадающего списка
function CustomSelect({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between gap-2 bg-[#F3F4F6] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:border-[#5FC36C] transition-colors">
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#E3F2E3] hover:text-black transition-colors flex items-center justify-between">
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check className="w-4 h-4 text-[#5FC36C] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsRequisites({ 
  clientOrg, 
  setToast, 
  onRefresh 
}: { 
  clientOrg: any, 
  setToast: any, 
  onRefresh?: () => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInn, setLoadingInn] = useState(false);
  const [loadingBik, setLoadingBik] = useState(false);

  // Стейты формы
  const [entityType, setEntityType] = useState(clientOrg?.entity_type || 'ip');
  const [name, setName] = useState(clientOrg?.name || '');
  const [contactPhone, setContactPhone] = useState(clientOrg?.contact_phone || '');
  const [inn, setInn] = useState(clientOrg?.inn || '');
  const [kpp, setKpp] = useState(clientOrg?.kpp || '');
  const [ogrn, setOgrn] = useState(clientOrg?.ogrn || '');
  const [address, setAddress] = useState(clientOrg?.address || '');
  const [directorName, setDirectorName] = useState(clientOrg?.director_name || '');

  const [taxSystem, setTaxSystem] = useState(clientOrg?.tax_system || 'ОСНО');
  const [taxObject, setTaxObject] = useState(clientOrg?.tax_object || '');
  const [isVatPayer, setIsVatPayer] = useState(clientOrg?.is_vat_payer || false);

  const [bankName, setBankName] = useState(clientOrg?.bank_name || '');
  const [bankBik, setBankBik] = useState(clientOrg?.bik || ''); 
  const [bankAccount, setBankAccount] = useState(clientOrg?.account || ''); 
  const [bankCorrAccount, setBankCorrAccount] = useState(clientOrg?.corr_account || ''); 

  // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: синхронизация стейтов при изменении clientOrg
  useEffect(() => {
    if (clientOrg) {
      setEntityType(clientOrg.entity_type || 'ip');
      setName(clientOrg.name || '');
      setContactPhone(clientOrg.contact_phone || '');
      setInn(clientOrg.inn || '');
      setKpp(clientOrg.kpp || '');
      setOgrn(clientOrg.ogrn || '');
      setAddress(clientOrg.address || '');
      setDirectorName(clientOrg.director_name || '');
      setTaxSystem(clientOrg.tax_system || 'ОСНО');
      setTaxObject(clientOrg.tax_object || '');
      setIsVatPayer(clientOrg.is_vat_payer || false);
      setBankName(clientOrg.bank_name || '');
      setBankBik(clientOrg.bik || '');
      setBankAccount(clientOrg.account || '');
      setBankCorrAccount(clientOrg.corr_account || '');
    }
  }, [clientOrg]);

  // Сброс объекта налогообложения при смене системы
  useEffect(() => {
    if (taxSystem !== 'УСН' && taxSystem !== 'АУСН') {
      setTaxObject('');
    } else if (!taxObject) {
      if (taxSystem === 'УСН') setTaxObject('Доходы (6%)');
      if (taxSystem === 'АУСН') setTaxObject('Доходы (8%)');
    }
  }, [taxSystem]);

  const handleInnSearch = async () => {
    if (!inn || inn.length < 10) return;
    setLoadingInn(true);
    try {
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': 'Token YOUR_DADATA_API_KEY' },
        body: JSON.stringify({ query: inn }),
      });
      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        const company = data.suggestions[0].data;
        setName(data.suggestions[0].value);
        setKpp(company.kpp || '');
        setOgrn(company.ogrn || '');
        setAddress(company.address?.value || '');
        setToast({ message: 'Данные по ИНН заполнены', type: 'success' });
      } else {
        setToast({ message: 'Организация не найдена', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Ошибка запроса к DaData', type: 'error' });
    } finally {
      setLoadingInn(false);
    }
  };

  const handleBikSearch = async () => {
    if (!bankBik || bankBik.length !== 9) return;
    setLoadingBik(true);
    try {
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': 'Token YOUR_DADATA_API_KEY' },
        body: JSON.stringify({ query: bankBik }),
      });
      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        const bank = data.suggestions[0].data;
        setBankName(bank.name?.payment || '');
        setBankCorrAccount(bank.correspondent_account || '');
        setToast({ message: 'Данные банка заполнены', type: 'success' });
      } else {
        setToast({ message: 'Банк не найден', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Ошибка запроса к DaData', type: 'error' });
    } finally {
      setLoadingBik(false);
    }
  };

  const handleSave = async () => {
    if (!clientOrg) return;
    setSaving(true);

    const { error } = await supabase.from('organizations').update({ 
      entity_type: entityType,
      name, 
      contact_phone: contactPhone,
      inn, kpp, ogrn, address, 
      director_name: directorName,
      tax_system: taxSystem,
      tax_object: taxObject,
      is_vat_payer: isVatPayer,
      bank_name: bankName, bik: bankBik, account: bankAccount, corr_account: bankCorrAccount
    }).eq('id', clientOrg.id);
    
    if (error) {
      setToast({ message: 'Ошибка сохранения: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Реквизиты сохранены', type: 'success' });
      setIsEditing(false);
      // Вызываем обновление, чтобы parent перезагрузил clientOrg
      if (onRefresh) onRefresh();
    }
    setSaving(false);
  };

  // --- РЕЖИМ ПРОСМОТРА ---
  if (!isEditing) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">Мои реквизиты</h2>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-[#5FC36C] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors">
            <Pencil className="w-4 h-4" /> Изменить реквизиты
          </button>
        </div>

        {clientOrg?.entity_type === 'individual' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
            <div>
              <p className="font-bold text-yellow-800">Вы — физическое лицо</p>
              <p className="text-sm text-yellow-700 font-medium">Выставление счета и отсрочка платежа доступны только для ИП и ООО. Вы можете оформить заказ за наличные или картой.</p>
            </div>
          </div>
        )}

        <div className="space-y-6 max-w-3xl">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Тип организации</p>
            <p className="font-bold">
              {clientOrg?.entity_type === 'ip' && 'Индивидуальный предприниматель (ИП)'}
              {clientOrg?.entity_type === 'ooo' && 'Общество с ограниченной ответственностью (ООО)'}
              {clientOrg?.entity_type === 'individual' && 'Физическое лицо'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Название / ФИО</p>
              <p className="font-bold">{clientOrg?.name || 'Не заполнено'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Контактный телефон</p>
              <p className="font-bold">{clientOrg?.contact_phone || 'Не заполнен'}</p>
            </div>
          </div>

          {clientOrg?.entity_type === 'ooo' && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Генеральный директор</p>
              <p className="font-bold">{clientOrg?.director_name || 'Не заполнен'}</p>
            </div>
          )}

          {clientOrg?.entity_type !== 'individual' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">ИНН</p>
                  <p className="font-bold">{clientOrg?.inn || 'Не заполнен'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">КПП</p>
                  <p className="font-bold">{clientOrg?.kpp || 'Не заполнен'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">ОГРН / ОГРНИП</p>
                  <p className="font-bold">{clientOrg?.ogrn || 'Не заполнен'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Юридический адрес</p>
                  <p className="font-bold">{clientOrg?.address || 'Не заполнен'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Система налогообложения</p>
                  <p className="font-bold">{clientOrg?.tax_system || 'Не выбрана'} {clientOrg?.tax_object ? `(${clientOrg.tax_object})` : ''}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">НДС</p>
                  <p className="font-bold">{clientOrg?.is_vat_payer ? 'Плательщик НДС' : 'Без НДС'}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Банк</p>
                  <p className="font-bold">{clientOrg?.bank_name || 'Не заполнен'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">БИК</p>
                    <p className="font-medium">{clientOrg?.bik || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Расчетный счет</p>
                    <p className="font-medium">{clientOrg?.account || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Корреспондентский счет</p>
                    <p className="font-medium">{clientOrg?.corr_account || '—'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- РЕЖИМ РЕДАКТИРОВАНИЯ ---
  return (
    <div>
      <h2 className="text-2xl font-black mb-6">Редактирование реквизитов</h2>
      <p className="text-sm text-gray-500 font-medium mb-6">Изменения вступят в силу для новых счетов и договоров.</p>

      <div className="max-w-3xl space-y-8">
        
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Тип организации</h3>
          <div>
            <label className="block text-sm font-bold mb-2">Тип организации</label>
            <CustomSelect 
              value={entityType} 
              onChange={setEntityType} 
              options={[
                { value: 'ip', label: 'Индивидуальный предприниматель (ИП)' },
                { value: 'ooo', label: 'Общество с ограниченной ответственностью (ООО)' },
                { value: 'individual', label: 'Физическое лицо' },
              ]} 
              placeholder="Выберите тип" 
            />
            {entityType === 'individual' && (
              <p className="text-xs text-red-500 font-bold mt-2">Внимание: физлицам счет не выставляется.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">{entityType === 'individual' ? 'ФИО' : 'Название организации'}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Контактный телефон</label>
              <input type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
            </div>
          </div>

          {entityType === 'ooo' && (
            <div>
              <label className="block text-sm font-bold mb-2">Генеральный директор (ФИО)</label>
              <input type="text" value={directorName} onChange={e => setDirectorName(e.target.value)} placeholder="Иванов Иван Иванович" className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
            </div>
          )}

          {entityType !== 'individual' && (
            <>
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mt-8">Данные организации</h3>
              
              <div>
                <label className="block text-sm font-bold mb-2">ИНН (для автозаполнения)</label>
                <div className="flex gap-2">
                  <input type="text" value={inn} onChange={e => setInn(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                  <button onClick={handleInnSearch} disabled={loadingInn || inn.length < 10} className="bg-[#5FC36C] text-white px-4 rounded-xl font-bold hover:bg-[#4CAF50] disabled:opacity-50 flex items-center gap-2">
                    {loadingInn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Найти'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">КПП</label>
                  <input type="text" value={kpp} onChange={e => setKpp(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">ОГРН / ОГРНИП</label>
                  <input type="text" value={ogrn} onChange={e => setOgrn(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Юридический адрес</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Система налогообложения</label>
                <CustomSelect value={taxSystem} onChange={setTaxSystem} options={[
                  { value: 'ОСНО', label: 'ОСНО (Общая, с НДС)' },
                  { value: 'УСН', label: 'УСН (Упрощенная)' },
                  { value: 'АУСН', label: 'АУСН (Автоматизированная)' },
                  { value: 'Патент', label: 'Патент (ПСН)' },
                  { value: 'НПД', label: 'НПД (Самозанятость)' },
                ]} placeholder="Выберите систему" />
              </div>

              {(taxSystem === 'УСН' || taxSystem === 'АУСН') && (
                <div className="pl-4 border-l-4 border-[#5FC36C]">
                  <label className="block text-sm font-bold mb-2">Объект налогообложения</label>
                  <CustomSelect value={taxObject} onChange={setTaxObject} options={
                    taxSystem === 'УСН' 
                    ? [{ value: 'Доходы (6%)', label: 'Доходы (6%)' }, { value: 'Доходы минус расходы (15%)', label: 'Доходы минус расходы (15%)' }]
                    : [{ value: 'Доходы (8%)', label: 'Доходы (8%)' }, { value: 'Доходы минус расходы (20%)', label: 'Доходы минус расходы (20%)' }]
                  } placeholder="Выберите объект" />
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <input type="checkbox" id="vatPayer" checked={isVatPayer} onChange={(e) => setIsVatPayer(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#5FC36C] focus:ring-[#5FC36C] cursor-pointer" />
                <label htmlFor="vatPayer" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  Плательщик НДС (счет будет выставлен с НДС)
                </label>
              </div>

              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mt-8">Банковские реквизиты</h3>
              
              <div>
                <label className="block text-sm font-bold mb-2">БИК банка (для автозаполнения)</label>
                <div className="flex gap-2">
                  <input type="text" value={bankBik} onChange={e => setBankBik(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                  <button onClick={handleBikSearch} disabled={loadingBik || bankBik.length !== 9} className="bg-[#5FC36C] text-white px-4 rounded-xl font-bold hover:bg-[#4CAF50] disabled:opacity-50 flex items-center gap-2">
                    {loadingBik ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Найти'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Название банка</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Расчетный счет</label>
                  <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Корреспондентский счет</label>
                  <input type="text" value={bankCorrAccount} onChange={e => setBankCorrAccount(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#5FC36C] text-white py-4 rounded-xl font-black hover:bg-[#4CAF50] transition-colors disabled:opacity-50">
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  );
}