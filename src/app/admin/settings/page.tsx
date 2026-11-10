'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import Toast from '../../../components/Toast';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'orgs' | 'profile'>('orgs');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // --- Стейты для списка организаций ---
  const [orgs, setOrgs] = useState<any[]>([]);
  const [newOrg, setNewOrg] = useState({
    name: '', entity_type: 'ИП', inn: '', kpp: '', ogrn: '', address: '', bank_name: '', bik: '', account: '', corr_account: '', director: '', accountant: '', tax_system: 'УСН Доходы (6%)'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [fetchingInn, setFetchingInn] = useState(false);
  const [fetchingBik, setFetchingBik] = useState(false);

  // --- Стейты для профиля (основной организации) ---
  // Используем ID по умолчанию для админа, если ничего нет
  const ADMIN_ID = '00000000-0000-0000-0000-000000000000';
  const [profileData, setProfileData] = useState({
    name: '', inn: '', kpp: '', ogrn: '', address: '', bank_name: '', bik: '', account: '', corr_account: '', director: '', accountant: ''
  });
  const [entityType, setEntityType] = useState('ООО'); 
  const [taxRegime, setTaxRegime] = useState('УСН');
  const [taxObject, setTaxObject] = useState('Доходы (6%)');


  // Загрузка данных
  const fetchAllData = async () => {
    setLoading(true);
    
    // 1. Загружаем все организации
    const { data: orgsData } = await supabase.from('admin_organizations').select('*').order('is_default', { ascending: false });
    setOrgs(orgsData || []);

    // 2. Загружаем профиль основной организации
    const { data: profile } = await supabase.from('admin_organizations').select('*').eq('id', ADMIN_ID).single();
    
    // Если профиля нет, но есть организации, берем первую дефолтную
    let sourceData = profile;
    if (!sourceData && orgsData && orgsData.length > 0) {
      sourceData = orgsData.find(o => o.is_default) || orgsData[0];
    }

    if (sourceData) {
      setEntityType(sourceData.entity_type || 'ООО');
      setProfileData({
        name: sourceData.name || '', inn: sourceData.inn || '', kpp: sourceData.kpp || '', ogrn: sourceData.ogrn || '', 
        address: sourceData.address || '', bank_name: sourceData.bank_name || '', bik: sourceData.bik || '', 
        account: sourceData.account || '', corr_account: sourceData.corr_account || '', director: sourceData.director || '',
        accountant: sourceData.accountant || ''
      });
      
      if (sourceData.tax_system) {
        if (sourceData.tax_system.startsWith('УСН')) {
          setTaxRegime('УСН');
          setTaxObject(sourceData.tax_system.includes('Доходы минус расходы') ? 'Доходы минус расходы (15%)' : 'Доходы (6%)');
        } else if (sourceData.tax_system.startsWith('АУСН')) {
          setTaxRegime('АУСН');
          setTaxObject(sourceData.tax_system.includes('Доходы минус расходы') ? 'Доходы минус расходы (20%)' : 'Доходы (8%)');
        } else {
          setTaxRegime(sourceData.tax_system);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  // --- ФУНКЦИИ ДЛЯ ВКЛАДКИ "МОИ ОРГАНИЗАЦИИ" ---
  const fetchByInnForOrg = async () => {
    if (!newOrg.inn || newOrg.inn.length < 10) { setToast({ message: 'Введите корректный ИНН', type: 'error' }); return; }
    setFetchingInn(true);
    try {
      const DADATA_KEY = '70f1eefc26057ffd266c229b45ff927301d5d6ff'; 
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Token ${DADATA_KEY}` },
        body: JSON.stringify({ query: newOrg.inn })
      });
      const result = await response.json();
      if (result.suggestions && result.suggestions.length > 0) {
        const company = result.suggestions[0].data;
        setNewOrg(prev => ({
          ...prev,
          name: company.name?.short_with_opf || prev.name,
          kpp: company.kpp || prev.kpp,
          ogrn: company.ogrn || prev.ogrn,
          address: company.address?.value || prev.address,
          director: company.management?.name || prev.director
        }));
        setToast({ message: 'Реквизиты заполнены!', type: 'success' });
      } else { setToast({ message: 'Не найдено', type: 'error' }); }
    } catch (e) { setToast({ message: 'Ошибка', type: 'error' }); } finally { setFetchingInn(false); }
  };

  const fetchByBikForOrg = async () => {
    if (!newOrg.bik || newOrg.bik.length !== 9) { setToast({ message: 'Введите БИК (9 цифр)', type: 'error' }); return; }
    setFetchingBik(true);
    try {
      const DADATA_KEY = '70f1eefc26057ffd266c229b45ff927301d5d6ff'; 
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Token ${DADATA_KEY}` },
        body: JSON.stringify({ query: newOrg.bik })
      });
      const result = await response.json();
      if (result.suggestions && result.suggestions.length > 0) {
        const bank = result.suggestions[0].data;
        setNewOrg(prev => ({
          ...prev,
          bank_name: bank.name?.payment || prev.bank_name,
          corr_account: bank.correspondent_account || prev.corr_account
        }));
        setToast({ message: 'Банк найден!', type: 'success' });
      } else { setToast({ message: 'Банк не найден', type: 'error' }); }
    } catch (e) { setToast({ message: 'Ошибка', type: 'error' }); } finally { setFetchingBik(false); }
  };

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const { error } = await supabase.from('admin_organizations').insert([newOrg]);
    if (!error) {
      setToast({ message: 'Организация добавлена!', type: 'success' });
      setNewOrg({ name: '', entity_type: 'ИП', inn: '', kpp: '', ogrn: '', address: '', bank_name: '', bik: '', account: '', corr_account: '', director: '', accountant: '', tax_system: 'УСН Доходы (6%)' });
      fetchAllData();
    } else { setToast({ message: 'Ошибка при добавлении', type: 'error' }); }
    setIsAdding(false);
  };

  const setDefaultOrg = async (id: string) => {
    await supabase.from('admin_organizations').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('admin_organizations').update({ is_default: true }).eq('id', id);
    fetchAllData();
  };

  const deleteOrg = async (id: string) => {
    if (!confirm('Удалить эту организацию?')) return;
    await supabase.from('admin_organizations').delete().eq('id', id);
    fetchAllData();
  };

  // --- ФУНКЦИИ ДЛЯ ВКЛАДКИ "МОЙ ПРОФИЛЬ" ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    let finalTaxSystem = taxRegime;
    if (taxRegime === 'УСН' || taxRegime === 'АУСН') {
      finalTaxSystem = `${taxRegime} ${taxObject}`;
    }

    const dataToSave = { ...profileData, tax_system: finalTaxSystem, entity_type: entityType };

    const { data: existing } = await supabase.from('admin_organizations').select('id').eq('id', ADMIN_ID).single();
    
    if (existing) {
      await supabase.from('admin_organizations').update(dataToSave).eq('id', ADMIN_ID);
    } else {
      await supabase.from('admin_organizations').insert([{ ...dataToSave, id: ADMIN_ID, is_default: true }]);
    }
    
    setToast({ message: 'Профиль сохранен!', type: 'success' });
    fetchAllData();
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4] text-[#4CAF50] font-bold">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-[#F4F9F4] text-[#1A3A2A] font-sans pb-20 relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white border-b border-[#E3F2E3] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-sm font-bold bg-[#F4F9F4] px-5 py-2 rounded-full hover:bg-[#E3F2E3]">← В админку</Link>
          <span className="text-xl font-extrabold text-[#4CAF50]">Настройки</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        
        {/* Переключатель вкладок */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('orgs')} className={`px-6 py-3 font-bold text-sm rounded-xl transition-all ${activeTab === 'orgs' ? 'bg-[#5FC36C] text-white shadow-md' : 'bg-white text-gray-500 border border-[#E3F2E3] hover:bg-gray-50'}`}>Мои организации</button>
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 font-bold text-sm rounded-xl transition-all ${activeTab === 'profile' ? 'bg-[#5FC36C] text-white shadow-md' : 'bg-white text-gray-500 border border-[#E3F2E3] hover:bg-gray-50'}`}>Мой профиль (основная организация)</button>
        </div>

        {/* ВКЛАДКА: СПИСОК ОРГАНИЗАЦИЙ */}
        {activeTab === 'orgs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Форма добавления */}
            <div className="bg-white p-6 rounded-[2rem] border border-[#E3F2E3] shadow-sm">
              <h2 className="text-xl font-extrabold mb-4">Добавить организацию</h2>
              <form onSubmit={handleAddOrg} className="space-y-3">
                <div className="flex gap-2 p-1 bg-[#F8FBF8] rounded-xl border border-[#E3F2E3] mb-4">
                  {['ИП', 'ООО'].map(type => (
                    <button key={type} type="button" onClick={() => setNewOrg({...newOrg, entity_type: type})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newOrg.entity_type === type ? 'bg-white text-[#4CAF50] shadow-sm' : 'text-gray-500'}`}>
                      {type}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <input required type="text" placeholder="ИНН" value={newOrg.inn} onChange={e => setNewOrg({...newOrg, inn: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                  </div>
                  <button type="button" onClick={fetchByInnForOrg} disabled={fetchingInn} className="bg-[#4A9EDE] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#3b8ecc] disabled:opacity-50 h-[50px]">
                    {fetchingInn ? '...' : 'Заполнить'}
                  </button>
                </div>

                <input required type="text" placeholder="Название" value={newOrg.name} onChange={e => setNewOrg({...newOrg, name: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="КПП (если есть)" value={newOrg.kpp} onChange={e => setNewOrg({...newOrg, kpp: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                  <input required type="text" placeholder="ОГРН" value={newOrg.ogrn} onChange={e => setNewOrg({...newOrg, ogrn: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                </div>
                <input required type="text" placeholder="Юридический адрес" value={newOrg.address} onChange={e => setNewOrg({...newOrg, address: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="ФИО директора" value={newOrg.director} onChange={e => setNewOrg({...newOrg, director: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="ФИО бухгалтера" value={newOrg.accountant} onChange={e => setNewOrg({...newOrg, accountant: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                
                <h3 className="font-bold text-sm mt-4">Банк</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <input required type="text" placeholder="БИК" maxLength={9} value={newOrg.bik} onChange={e => setNewOrg({...newOrg, bik: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                  </div>
                  <button type="button" onClick={fetchByBikForOrg} disabled={fetchingBik} className="bg-[#4A9EDE] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#3b8ecc] disabled:opacity-50 h-[50px]">
                    {fetchingBik ? '...' : 'Заполнить'}
                  </button>
                </div>
                <input required type="text" placeholder="Банк" value={newOrg.bank_name} onChange={e => setNewOrg({...newOrg, bank_name: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Р/С" value={newOrg.account} onChange={e => setNewOrg({...newOrg, account: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                  <input required type="text" placeholder="К/С" value={newOrg.corr_account} onChange={e => setNewOrg({...newOrg, corr_account: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                </div>

                <button type="submit" disabled={isAdding} className="w-full bg-[#5FC36C] text-white py-3 rounded-xl font-bold mt-4 shadow-[0_4px_10px_rgba(95,195,108,0.3)] hover:bg-[#4CAF50]">
                  {isAdding ? 'Добавление...' : 'Добавить организацию'}
                </button>
              </form>
            </div>

            {/* Список организаций */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold mb-4">Список ваших организаций</h2>
              {orgs.length === 0 && <div className="text-gray-500">Пока нет добавленных организаций.</div>}
              {orgs.map(org => (
                <div key={org.id} className={`p-5 rounded-2xl border-2 transition-all flex justify-between items-center ${org.is_default ? 'bg-[#E3F2E3] border-[#4CAF50]' : 'bg-white border-[#E3F2E3]'}`}>
                  <div>
                    <div className="flex gap-2 items-center mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#4CAF50]">{org.entity_type}</span>
                      {org.is_default && <span className="bg-[#4CAF50] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">По умолчанию</span>}
                    </div>
                    <h3 className="font-bold text-lg">{org.name}</h3>
                    <p className="text-sm text-gray-600">ИНН: {org.inn} • ОГРН: {org.ogrn}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!org.is_default && (
                      <button onClick={() => setDefaultOrg(org.id)} className="text-xs font-bold text-gray-500 hover:text-[#4CAF50] bg-gray-100 px-3 py-1 rounded-md">Сделать основной</button>
                    )}
                    <button onClick={() => deleteOrg(org.id)} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-md">Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА: ПРОФИЛЬ */}
        {activeTab === 'profile' && (
          <div className="bg-white p-8 rounded-[2rem] border border-[#E3F2E3] shadow-sm max-w-3xl mx-auto">
            <h2 className="text-2xl font-extrabold mb-6">Реквизиты основной организации</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="flex gap-2 p-1 bg-[#F8FBF8] rounded-xl border border-[#E3F2E3]">
                {['ИП', 'ООО'].map(type => (
                  <button key={type} type="button" onClick={() => setEntityType(type)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${entityType === type ? 'bg-white text-[#4CAF50] shadow-sm' : 'text-gray-500'}`}>
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="ИНН" value={profileData.inn} onChange={e => setProfileData({...profileData, inn: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input type="text" placeholder="КПП" value={profileData.kpp} onChange={e => setProfileData({...profileData, kpp: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="Название" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50] md:col-span-2" />
                <input required type="text" placeholder="ОГРН" value={profileData.ogrn} onChange={e => setProfileData({...profileData, ogrn: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="Юридический адрес" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="ФИО директора" value={profileData.director} onChange={e => setProfileData({...profileData, director: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="ФИО бухгалтера" value={profileData.accountant} onChange={e => setProfileData({...profileData, accountant: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
              </div>

              <h3 className="text-lg font-bold mt-6 mb-2">Банковские реквизиты</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="Банк" value={profileData.bank_name} onChange={e => setProfileData({...profileData, bank_name: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="БИК" value={profileData.bik} onChange={e => setProfileData({...profileData, bik: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="Расчетный счет" value={profileData.account} onChange={e => setProfileData({...profileData, account: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
                <input required type="text" placeholder="Корр. счет" value={profileData.corr_account} onChange={e => setProfileData({...profileData, corr_account: e.target.value})} className="w-full bg-[#F8FBF8] border-2 border-[#E3F2E3] rounded-xl p-3 focus:outline-none focus:border-[#4CAF50]" />
              </div>

              <button type="submit" disabled={saving} className="w-full bg-[#5FC36C] text-white py-4 rounded-xl font-bold mt-6 shadow-[0_4px_15px_rgba(95,195,108,0.3)] hover:bg-[#4CAF50] disabled:opacity-50">
                {saving ? 'Сохранение...' : 'Сохранить данные'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}