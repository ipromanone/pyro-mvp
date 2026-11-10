'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Toast from '../../../components/Toast';
import PhoneInput from '../../../components/PhoneInput';
import EmailInput from '../../../components/EmailInput';
import InnInput from '../../../components/InnInput';
import BankInput from '../../../components/BankInput';
import { ArrowLeft, Save, Building2, Shield, Bell, User, Lock, CheckCircle2, Smartphone, Mail, Package, Megaphone } from 'lucide-react';

// Внутренний компонент, который использует useSearchParams
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [clientOrg, setClientOrg] = useState<any>(null);
  
  // По умолчанию вкладка "profile", но если в URL есть tab=notifications, откроем её
  const [activeTab, setActiveTab] = useState<'profile' | 'requisites' | 'security' | 'notifications'>('profile');

  const [formData, setFormData] = useState({
    name: '', entity_type: 'ИП', inn: '', kpp: '', ogrn: '', address: '', contact_phone: '', email: '',
    bank_name: '', bik: '', account: '', corr_account: ''
  });

  // Стейты для смены пароля
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Стейты для уведомлений
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [notifDocs, setNotifDocs] = useState(true);
  const [notifSms, setNotifSms] = useState(false);

  useEffect(() => {
    // Устанавливаем вкладку на основе URL
    if (tabParam === 'notifications') setActiveTab('notifications');
    else if (tabParam === 'requisites') setActiveTab('requisites');
    else if (tabParam === 'security') setActiveTab('security');
  }, [tabParam]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      let { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
      
      if (!clientData || clientData.length === 0) {
        const { data: newOrg } = await supabase.from('organizations').insert([{
          user_id: session.user.id,
          name: session.user.email?.split('@')[0] || 'Новая организация',
          email: session.user.email
        }]).select();
        if (newOrg) clientData = newOrg;
      }

      if (clientData && clientData.length > 0) {
        setClientOrg(clientData[0]);
        setFormData({
          name: clientData[0].name || '',
          entity_type: clientData[0].entity_type || 'ИП',
          inn: clientData[0].inn || '',
          kpp: clientData[0].kpp || '',
          ogrn: clientData[0].ogrn || '',
          address: clientData[0].address || '',
          contact_phone: clientData[0].contact_phone || '+7',
          email: clientData[0].email || '',
          bank_name: clientData[0].bank_name || '',
          bik: clientData[0].bik || '',
          account: clientData[0].account || '',
          corr_account: clientData[0].corr_account || ''
        });
      }

      const savedCart = localStorage.getItem('pyro_cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(Object.values(cart).reduce((a: number, b: any) => a + Number(b), 0));
      }
      const savedFav = localStorage.getItem('pyro_favorites');
      if (savedFav) setFavoritesCount(JSON.parse(savedFav).length);

      const savedNotif = localStorage.getItem('pyro_notif_settings');
      if (savedNotif) {
        const n = JSON.parse(savedNotif);
        setNotifOrders(n.orders ?? true);
        setNotifPromo(n.promo ?? false);
        setNotifDocs(n.docs ?? true);
        setNotifSms(n.sms ?? false);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInnDataLoaded = (data: any) => {
    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name,
      kpp: data.kpp || prev.kpp,
      ogrn: data.ogrn || prev.ogrn,
      address: data.address || prev.address,
      bank_name: data.bank_name || prev.bank_name,
      bik: data.bik || prev.bik,
      account: data.account || prev.account,
      corr_account: data.corr_account || prev.corr_account
    }));
    setToast({ message: 'Данные организации подгружены!', type: 'success' });
  };

  const handleBankDataLoaded = (data: any) => {
    setFormData(prev => ({
      ...prev,
      bank_name: data.bank_name || prev.bank_name,
      bik: data.bik || prev.bik,
      corr_account: data.corr_account || prev.corr_account
    }));
    setToast({ message: 'Данные банка подгружены!', type: 'success' });
  };

  const handleSaveProfile = async () => {
    if (!clientOrg) return;
    if (!formData.contact_phone || formData.contact_phone.length < 10) {
      setToast({ message: 'Введите корректный номер телефона', type: 'error' });
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setToast({ message: 'Введите корректный email', type: 'error' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('organizations').update({
      contact_phone: formData.contact_phone,
      email: formData.email
    }).eq('id', clientOrg.id);

    if (error) {
      setToast({ message: 'Ошибка: ' + error.message, type: 'error' });
    } else {
      setClientOrg({ ...clientOrg, contact_phone: formData.contact_phone, email: formData.email });
      setToast({ message: 'Данные сохранены!', type: 'success' });
    }
    setSaving(false);
  };

  const handleSaveRequisites = async () => {
    if (!clientOrg) return;
    if (!formData.name || !formData.inn) {
      setToast({ message: 'Заполните Название и ИНН', type: 'error' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('organizations').update({
      name: formData.name,
      entity_type: formData.entity_type,
      inn: formData.inn,
      kpp: formData.kpp,
      ogrn: formData.ogrn,
      address: formData.address,
      bank_name: formData.bank_name,
      bik: formData.bik,
      account: formData.account,
      corr_account: formData.corr_account
    }).eq('id', clientOrg.id);

    if (error) {
      setToast({ message: 'Ошибка: ' + error.message, type: 'error' });
    } else {
      setClientOrg({ ...clientOrg, ...formData });
      setToast({ message: 'Реквизиты сохранены!', type: 'success' });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setToast({ message: 'Пароль должен быть не менее 6 символов', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Пароли не совпадают', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setToast({ message: 'Ошибка смены пароля: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Пароль успешно изменен!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsChangingPassword(false);
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('pyro_notif_settings', JSON.stringify({
      orders: notifOrders,
      promo: notifPromo,
      docs: notifDocs,
      sms: notifSms
    }));
    setToast({ message: 'Настройки уведомлений сохранены!', type: 'success' });
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-[#5FC36C]' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientOrg?.name || 'Профиль'} />

      <div className="max-w-[1000px] mx-auto px-6 pt-8">
        <Link href="/shop/profile" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#5FC36C] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад в профиль
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-2">
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'profile' ? 'bg-[#5FC36C] text-white shadow-lg shadow-green-500/20' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <User className="w-5 h-5" /> Мои данные
            </button>
            <button onClick={() => setActiveTab('requisites')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'requisites' ? 'bg-[#5FC36C] text-white shadow-lg shadow-green-500/20' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Building2 className="w-5 h-5" /> Реквизиты
            </button>
            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'security' ? 'bg-[#5FC36C] text-white shadow-lg shadow-green-500/20' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Shield className="w-5 h-5" /> Безопасность
            </button>
            <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'notifications' ? 'bg-[#5FC36C] text-white shadow-lg shadow-green-500/20' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Bell className="w-5 h-5" /> Уведомления
            </button>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black mb-6">Мои данные</h2>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Контактный телефон *</label>
                    <PhoneInput value={formData.contact_phone} onChange={(val) => setFormData({ ...formData, contact_phone: val })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <EmailInput value={formData.email} onChange={(val) => setFormData({ ...formData, email: val })} />
                  </div>
                  <div className="pt-4">
                    <button onClick={handleSaveProfile} disabled={saving} className="bg-[#5FC36C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50">
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'requisites' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black mb-6">Реквизиты организации</h2>
                  
                  <InnInput 
                    value={formData.inn} 
                    onChange={(val) => setFormData({ ...formData, inn: val })} 
                    onDataLoaded={handleInnDataLoaded} 
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Название / ФИО *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" placeholder="Заполнится автоматически" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">КПП</label>
                      <input type="text" name="kpp" value={formData.kpp} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">ОГРН</label>
                      <input type="text" name="ogrn" value={formData.ogrn} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Юридический адрес</label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-bold mb-4">Банковские реквизиты</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Банк</label>
                        <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" placeholder="Заполнится автоматически" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <BankInput 
                          value={formData.bik} 
                          onChange={(val) => setFormData({ ...formData, bik: val })} 
                          onDataLoaded={handleBankDataLoaded} 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Р/с</label>
                        <input type="text" name="account" value={formData.account} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">К/с</label>
                        <input type="text" name="corr_account" value={formData.corr_account} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button onClick={handleSaveRequisites} disabled={saving} className="flex items-center gap-2 bg-[#5FC36C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50">
                      <Save className="w-5 h-5" /> {saving ? 'Сохранение...' : 'Сохранить реквизиты'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black mb-6">Безопасность</h2>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="w-6 h-6 text-[#5FC36C]" />
                      <h3 className="text-xl font-bold">Смена пароля</h3>
                    </div>
                    
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Новый пароль</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)} 
                          placeholder="Минимум 6 символов"
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Повторите пароль</label>
                        <input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)} 
                          placeholder="Повторите пароль"
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" 
                        />
                      </div>
                      <button 
                        onClick={handleChangePassword} 
                        disabled={isChangingPassword}
                        className="bg-[#5FC36C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors disabled:opacity-50"
                      >
                        {isChangingPassword ? 'Сохранение...' : 'Сменить пароль'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <Smartphone className="w-6 h-6 text-gray-400" />
                      <h3 className="text-xl font-bold text-gray-400">Двухфакторная аутентификация</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">Дополнительная защита аккаунта с помощью кода из SMS или приложения.</p>
                    <button disabled className="bg-gray-100 text-gray-400 px-6 py-2 rounded-xl font-bold cursor-not-allowed">
                      Скоро
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-6 h-6 text-gray-400" />
                      <h3 className="text-xl font-bold text-gray-400">Активные устройства</h3>
                    </div>
                    <p className="text-gray-500 text-sm">Здесь вы сможете увидеть, с каких устройств выполнен вход.</p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black mb-6">Уведомления</h2>

                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Статусы заказов</h3>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-[#5FC36C]"><Package className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-gray-900">Изменение статуса заказа</p>
                            <p className="text-xs text-gray-500">Когда заказ подтвержден, собран или отправлен</p>
                          </div>
                        </div>
                        <Toggle enabled={notifOrders} onChange={() => setNotifOrders(!notifOrders)} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Документы</h3>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-[#5FC36C]"><Mail className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-gray-900">Счета и договоры на почту</p>
                            <p className="text-xs text-gray-500">Когда сформирован счет или подписан договор</p>
                          </div>
                        </div>
                        <Toggle enabled={notifDocs} onChange={() => setNotifDocs(!notifDocs)} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Акции и новости</h3>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-[#5FC36C]"><Megaphone className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-gray-900">Сезонные распродажи</p>
                            <p className="text-xs text-gray-500">Скидки и специальные предложения</p>
                          </div>
                        </div>
                        <Toggle enabled={notifPromo} onChange={() => setNotifPromo(!notifPromo)} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">SMS</h3>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-[#5FC36C]"><Smartphone className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-gray-900">SMS-уведомления</p>
                            <p className="text-xs text-gray-500">Оповещения на ваш телефон</p>
                          </div>
                        </div>
                        <Toggle enabled={notifSms} onChange={() => setNotifSms(!notifSms)} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button onClick={handleSaveNotifications} className="bg-[#5FC36C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20">
                      Сохранить настройки
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Обертка в Suspense (обязательно для Next.js при использовании useSearchParams)
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB]"></div>}>
      <SettingsContent />
    </Suspense>
  );
}