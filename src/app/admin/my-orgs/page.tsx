'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import Toast from '../../../components/Toast';
import { Plus, Check, Pencil, Trash2 } from 'lucide-react';

export default function MyOrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Форма
  const [newName, setNewName] = useState('');
  const [newInn, setNewInn] = useState('');
  const [newKpp, setNewKpp] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBik, setNewBik] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newCorrAccount, setNewCorrAccount] = useState('');
  
  // Новые поля, которые есть в базе
  const [newDirector, setNewDirector] = useState('');
  const [newAccountant, setNewAccountant] = useState('');
  const [newTaxSystem, setNewTaxSystem] = useState('ОСНО');

  const fetchOrgs = async () => {
    const { data, error } = await supabase.from('admin_organizations').select('*').order('is_default', { ascending: false });
    if (!error && data) setOrgs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const { error } = await supabase.from('admin_organizations').insert([{
      name: newName,
      inn: newInn,
      kpp: newKpp,
      address: newAddress,
      bank_name: newBankName,
      bik: newBik,
      account: newAccount,
      corr_account: newCorrAccount,
      director: newDirector,
      accountant: newAccountant,
      tax_system: newTaxSystem,
      is_default: orgs.length === 0 // Если это первая организация, ставим по умолчанию
    }]);

    if (error) {
      setToast({ message: 'Ошибка: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Организация добавлена', type: 'success' });
      setNewName(''); setNewInn(''); setNewKpp(''); setNewAddress(''); setNewBankName(''); setNewBik(''); setNewAccount(''); setNewCorrAccount('');
      setNewDirector(''); setNewAccountant(''); setNewTaxSystem('ОСНО');
      fetchOrgs();
    }
    setIsAdding(false);
  };

  const setDefault = async (id: string) => {
    // Снимаем default со всех
    await supabase.from('admin_organizations').update({ is_default: false }).neq('id', id);
    // Ставим на выбранную
    const { error } = await supabase.from('admin_organizations').update({ is_default: true }).eq('id', id);
    if (!error) {
      setToast({ message: 'Организация выбрана по умолчанию', type: 'success' });
      fetchOrgs();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту организацию?')) return;
    const { error } = await supabase.from('admin_organizations').delete().eq('id', id);
    if (!error) {
      setToast({ message: 'Организация удалена', type: 'success' });
      fetchOrgs();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-black">Мои организации</h1>
          <Link href="/admin" className="text-sm font-bold bg-[#F4F9F4] px-4 py-2 rounded-xl hover:bg-[#E3F2E3]">Назад в админку</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Форма добавления */}
          <div className="lg:col-span-1">
            <form onSubmit={handleAdd} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm space-y-4 sticky top-24">
              <h2 className="text-xl font-black mb-2">Новая организация</h2>
              
              <input required type="text" placeholder="Название (ИП/ООО)" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              
              <div className="grid grid-cols-2 gap-2">
                <input required type="text" placeholder="ИНН" value={newInn} onChange={e => setNewInn(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                <input type="text" placeholder="КПП" value={newKpp} onChange={e => setNewKpp(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              </div>
              
              <input type="text" placeholder="Юридический адрес" value={newAddress} onChange={e => setNewAddress(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              
              <input type="text" placeholder="Название банка" value={newBankName} onChange={e => setNewBankName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              
              <div className="grid grid-cols-2 gap-2">
                <input required type="text" placeholder="БИК" value={newBik} onChange={e => setNewBik(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                <input required type="text" placeholder="Расчетный счет" value={newAccount} onChange={e => setNewAccount(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              </div>
              
              <input type="text" placeholder="Корреспондентский счет" value={newCorrAccount} onChange={e => setNewCorrAccount(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />

              <input type="text" placeholder="Директор (ФИО)" value={newDirector} onChange={e => setNewDirector(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              <input type="text" placeholder="Главный бухгалтер (ФИО)" value={newAccountant} onChange={e => setNewAccountant(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none" />
              
              <select value={newTaxSystem} onChange={e => setNewTaxSystem(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5FC36C] outline-none">
                <option value="ОСНО">ОСНО</option>
                <option value="УСН">УСН</option>
                <option value="АУСН">АУСН</option>
                <option value="Патент">Патент</option>
                <option value="НПД">НПД</option>
              </select>

              <button type="submit" disabled={isAdding} className="w-full bg-[#5FC36C] text-white py-3 rounded-xl font-black hover:bg-[#4CAF50] transition-colors disabled:opacity-50">
                {isAdding ? 'Добавление...' : 'Добавить организацию'}
              </button>
            </form>
          </div>

          {/* Список организаций */}
          <div className="lg:col-span-2 space-y-4">
            {orgs.map(org => (
              <div key={org.id} className={`bg-white p-6 rounded-[1.5rem] border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${org.is_default ? 'border-[#5FC36C] bg-[#F9FDF9]' : 'border-gray-100'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-black text-lg">{org.name}</h3>
                    {org.is_default && <span className="bg-[#5FC36C] text-white text-[10px] font-bold px-2 py-1 rounded-md">По умолчанию</span>}
                  </div>
                  <p className="text-sm text-gray-600">ИНН: {org.inn} | КПП: {org.kpp || '—'}</p>
                  <p className="text-sm text-gray-600">Банк: {org.bank_name}</p>
                  <p className="text-sm text-gray-600">Счет: {org.account}</p>
                </div>
                <div className="flex gap-2">
                  {!org.is_default && (
                    <button onClick={() => setDefault(org.id)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200" title="Сделать по умолчанию">
                      <Check className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(org.id)} className="p-2 bg-red-50 rounded-lg hover:bg-red-100" title="Удалить">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            {orgs.length === 0 && (
              <div className="bg-white p-8 rounded-[1.5rem] border border-gray-100 text-center text-gray-500">
                У вас пока нет добавленных организаций.
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}