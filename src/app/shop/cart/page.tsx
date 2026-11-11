'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import Toast from '../../../components/Toast';
import ShopHeader from '../../../components/ShopHeader';
import InvoiceTemplate from '../../../components/InvoiceTemplate';
import { numberToWords } from '../../../utils/generateInvoice';
import { loadCartFromDB, saveCartToDB } from '../../../utils/cartHelpers';
import { Trash2, MapPin, Truck, Package, Clock, CheckCircle, AlertTriangle, ShoppingCart, FileWarning, CreditCard, Lock, Info, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [adminOrg, setAdminOrg] = useState<any>(null);
  
  const [paymentMethod, setPaymentMethod] = useState('Счет');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [address, setAddress] = useState('');
  
  // Стейты для формы карты
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [isCheckout, setIsCheckout] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successDeliveryMethod, setSuccessDeliveryMethod] = useState('');
  
  const [isContractSigned, setIsContractSigned] = useState(false);
  const [isRequisitesFilled, setIsRequisitesFilled] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Демо-стоимость доставки
  const [deliveryCost, setDeliveryCost] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!session) { router.push('/'); return; }
      
      setUserId(session.user.id);
      setIsAuthorized(true);

      const dbCart = await loadCartFromDB(session.user.id);
      if (isMounted) {
        setCart(dbCart);
        setSelectedItems(Object.keys(dbCart));
      }

      const [clientRes, adminRes] = await Promise.all([
        supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1),
        supabase.from('admin_organizations').select('*').eq('is_default', true).single()
      ]);

      if (clientRes.data && clientRes.data.length > 0 && isMounted) {
        const org = clientRes.data[0];
        setClientOrg(org);
        setAddress(org.address || '');
        setIsContractSigned(org.contract_signed || false);
        setIsRequisitesFilled(!!(org.name && org.inn && org.contact_phone));
      }
      if (adminRes.data && isMounted) setAdminOrg(adminRes.data);

      const cartIds = Object.keys(dbCart);
      if (cartIds.length > 0) {
        const { data: productsData } = await supabase.from('products').select('*').in('id', cartIds);
        if (productsData && isMounted) setAllProducts(productsData);
      }
      
      if (isMounted) setProductsLoading(false);
    }
    
    init();
    return () => { isMounted = false; };
  }, [router]);

  // Логика расчета стоимости доставки (демо)
  useEffect(() => {
    if (deliveryMethod === 'yandex') setDeliveryCost(500);
    else if (deliveryMethod === 'dostavista') setDeliveryCost(450);
    else setDeliveryCost(0);
  }, [deliveryMethod]);

  useEffect(() => {
    if (paymentMethod === 'Наличные' && (deliveryMethod === 'yandex' || deliveryMethod === 'dostavista')) setDeliveryMethod('pickup');
  }, [paymentMethod, deliveryMethod]);

  const updateCart = async (newCart: { [key: string]: number }) => {
    setCart(newCart);
    if (userId) await saveCartToDB(userId, newCart);
  };

  const handleToggleAll = () => {
    if (selectedItems.length === Object.keys(cart).length) setSelectedItems([]);
    else setSelectedItems(Object.keys(cart));
  };

  const handleQuantityChange = async (id: string, delta: number) => {
    const newQty = (cart[id] || 0) + delta;
    if (newQty <= 0) {
      const { [id]: _, ...rest } = cart;
      await updateCart(rest);
      setSelectedItems(prev => prev.filter(item => item !== id));
    } else {
      await updateCart({ ...cart, [id]: newQty });
    }
  };

  const handleDelete = async (id: string) => {
    const { [id]: _, ...rest } = cart;
    await updateCart(rest);
    setSelectedItems(prev => prev.filter(item => item !== id));
  };

  const selectedTotal = selectedItems.reduce((total, id) => {
    const product = allProducts.find(p => p.id === id);
    return total + (product ? product.price * (cart[id] || 0) : 0);
  }, 0);

  const finalTotal = selectedTotal + deliveryCost;
  const selectedCount = selectedItems.reduce((count, id) => count + (cart[id] || 0), 0);
  const isThirdPartyDelivery = deliveryMethod === 'yandex' || deliveryMethod === 'dostavista';

  const handleCheckout = async () => {
    if (!isRequisitesFilled) {
      setToast({ message: 'Пожалуйста, заполните реквизиты в личном кабинете', type: 'error' });
      return;
    }
    if (!isContractSigned) {
      setToast({ message: 'Для оформления заказа необходимо подписать договор поставки', type: 'error' });
      return;
    }
    if (paymentMethod === 'Карта' && (!cardNumber || !cardExpiry || !cardCvc || !cardName)) {
      setToast({ message: 'Заполните все данные банковской карты', type: 'error' });
      return;
    }
    if (isThirdPartyDelivery && !address) {
      setToast({ message: 'Для сторонней доставки укажите адрес', type: 'error' });
      return;
    }

    let paymentStatus = 'Ожидает оплаты';
    let deliveryStatus = 'На сборке';

    if (paymentMethod === 'Счет') {
      paymentStatus = 'Ожидает оплаты';
      deliveryStatus = 'Ожидает оплаты';
    } else if (paymentMethod === 'Карта') {
      paymentStatus = 'Ожидает подтверждения';
      deliveryStatus = 'На сборке';
    } else if (paymentMethod === 'Наличные') {
      paymentStatus = 'Оплата при получении';
      deliveryStatus = 'На сборке';
    }

    const invoiceNumber = `СЧ-${Math.floor(Math.random() * 10000) + 1000}`;
    const { data: orderData, error } = await supabase.from('orders').insert([{
      customer_name: clientOrg.name, customer_phone: clientOrg.contact_phone, 
      total_price: finalTotal,
      payment_method: paymentMethod, 
      delivery_method: deliveryMethod, 
      delivery_address: address,
      delivery_status: deliveryStatus,
      payment_status: paymentStatus
    }]).select().single();

    if (error || !orderData) { setToast({ message: 'Ошибка: ' + error?.message, type: 'error' }); return; }
    
    await supabase.from('order_items').insert(selectedItems.map(id => {
      const p = allProducts.find(prod => prod.id === id);
      return { order_id: orderData.id, product_id: id, quantity: cart[id], price: p?.price || 0 };
    }));

    if (paymentMethod === 'Счет') {
      await supabase.from('invoices').insert([{
        user_id: clientOrg.user_id, order_id: orderData.id, invoice_number: invoiceNumber,
        amount: finalTotal, status: 'Ожидает оплаты', admin_org_id: adminOrg?.id || null
      }]);
      setInvoiceData({
        invoiceNumber, date: new Date().toLocaleDateString('ru-RU'), adminOrg, clientOrg,
        items: [
          ...selectedItems.map(id => ({ name: allProducts.find(p => p.id === id)?.name, quantity: cart[id], price: allProducts.find(p => p.id === id)?.price })),
          ...(deliveryCost > 0 ? [{ name: `Доставка (${deliveryMethod === 'yandex' ? 'Яндекс' : 'Достависта'})`, quantity: 1, price: deliveryCost }] : [])
        ],
        total: finalTotal, totalWords: numberToWords(finalTotal)
      });
      setIsCheckout(false); setShowInvoiceModal(true); setSuccessDeliveryMethod(deliveryMethod);
    } else {
      setSuccessDeliveryMethod(deliveryMethod); setOrderSuccess(true); setIsCheckout(false);
    }
    
    await updateCart({}); 
    setSelectedItems([]);
  };

  // --- МАСКИ ДЛЯ КАРТЫ ---
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    const formatted = raw.replace(/(\d{2})(?=\d)/, '$1/');
    setCardExpiry(formatted);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvc(raw);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    setCardName(raw);
  };

  if (!isAuthorized) return <div className="min-h-screen bg-[#F9FAFB]"></div>;
  if (productsLoading && allProducts.length === 0) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = allProducts.find(p => p.id === id);
    return { ...product, qty, id };
  }).filter(Boolean);

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
        <ShopHeader cartCount={0} favoritesCount={0} clientName={clientOrg?.name || 'Профиль'} />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-[#5FC36C] rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-white" /></div>
            <h1 className="text-3xl font-black mb-4">Заказ оформлен!</h1>
            <p className="text-gray-600 font-medium mb-8">
              {paymentMethod === 'Карта' 
                ? 'Демо-оплата прошла успешно. Ожидайте подтверждения менеджера.' 
                : 'Мы свяжемся с вами для подтверждения.'}
            </p>
            <button onClick={() => router.push('/shop/orders')} className="w-full bg-[#5FC36C] text-white py-4 rounded-xl font-black hover:bg-[#4CAF50]">Перейти в заказы</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ShopHeader cartCount={Object.values(cart).reduce((a, b) => a + Number(b), 0)} favoritesCount={0} clientName={clientOrg?.name || 'Профиль'} />
      
      <div className="flex-grow max-w-[1200px] mx-auto px-6 mt-8 pb-20 w-full">
        <h1 className="text-4xl font-black mb-8">Корзина</h1>

        {(!isRequisitesFilled || !isContractSigned) && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-4 shadow-sm">
            <FileWarning className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <h3 className="text-lg font-black text-red-700 mb-2">Внимание!</h3>
              <p className="text-red-600 font-medium mb-4">Чтобы оформить заказ, вам нужно:</p>
              <ul className="list-disc pl-5 text-red-600 font-bold mb-4 space-y-1">
                {!isRequisitesFilled && <li>Заполнить реквизиты в <Link href="/shop/settings" className="underline hover:text-red-800">Настройках профиля</Link>.</li>}
                {!isContractSigned && <li>Подписать <Link href="/shop/contract" className="underline hover:text-red-800">договор поставки</Link>.</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-grow w-full">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={cartItems.length > 0 && selectedItems.length === cartItems.length} onChange={handleToggleAll} className="w-5 h-5 rounded border-gray-300 text-[#5FC36C] focus:ring-[#5FC36C]" />
                  <span className="font-bold">Выбрать все</span>
                </label>
                <span className="text-sm font-bold text-gray-500">{cartItems.length} товаров</span>
              </div>
              
              {cartItems.map(item => (
                <div key={item.id} className="p-6 border-b border-gray-50 last:border-0 flex gap-6 items-center">
                  <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => setSelectedItems(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} className="w-5 h-5 rounded border-gray-300 text-[#5FC36C] focus:ring-[#5FC36C]" />
                  
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-24 h-32 object-cover rounded-xl border border-gray-100" />
                  ) : (
                    <div className="w-24 h-32 bg-gray-100 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold text-center p-2">Нет фото</div>
                  )}

                  <div className="flex-grow">
                    <h3 className="font-bold text-lg line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">{item.brand}</p>
                    <button onClick={() => handleDelete(item.id)} className="text-sm text-gray-400 hover:text-red-500 mt-3 flex items-center gap-1 font-bold">
                      <Trash2 className="w-4 h-4" /> Удалить
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-2xl font-black">{item.price} ₽</div>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => handleQuantityChange(item.id, -1)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-black font-bold">-</button>
                      <span className="px-4 font-bold">{item.qty}</span>
                      <button onClick={() => handleQuantityChange(item.id, 1)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-black font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))}
              
              {cartItems.length === 0 && (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
                    <ShoppingCart className="w-10 h-10" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">Корзина пуста</p>
                  <p className="text-gray-500 font-medium mt-2">Добавьте товары из каталога, чтобы оформить заказ.</p>
                  <button onClick={() => router.push('/shop')} className="mt-6 bg-[#5FC36C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4CAF50]">В каталог</button>
                </div>
              )}
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-2xl font-black mb-6">Оформление</h2>
                
                <div className="bg-gray-50 p-5 rounded-2xl mb-6">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-2">Заказ на:</p>
                  <p className="font-bold text-lg">{clientOrg?.name}</p>
                  <p className="text-sm text-gray-600 font-medium">{clientOrg?.contact_phone}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Адрес доставки</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Город, улица, дом" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none" />
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-3">Оплата</h3>
                  <div className="space-y-2">
                    {['Счет', 'Карта', 'Наличные'].map(m => (
                      <label key={m} className={`flex items-center p-3 border-2 rounded-xl cursor-pointer ${paymentMethod === m ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200'}`}>
                        <input type="radio" name="pay" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="text-[#5FC36C]" />
                        <span className="ml-3 font-bold text-sm">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'Карта' && (
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-700 font-bold">
                        <CreditCard className="w-5 h-5 text-[#5FC36C]" /> Данные карты
                      </div>
                      <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Демо-режим</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <input 
                          type="text" 
                          value={cardNumber} 
                          onChange={handleCardNumberChange} 
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none tracking-widest"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input 
                            type="text" 
                            value={cardExpiry} 
                            onChange={handleExpiryChange} 
                            placeholder="ММ/ГГ"
                            maxLength={5}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none"
                          />
                        </div>
                        <div>
                          <input 
                            type="password"
                            value={cardCvc} 
                            onChange={handleCvcChange} 
                            placeholder="CVC"
                            maxLength={3}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <input 
                          type="text" 
                          value={cardName} 
                          onChange={handleNameChange} 
                          placeholder="IVAN IVANOV"
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 font-medium">
                      <Lock className="w-3 h-3" /> Безопасная оплата (демо)
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold mb-3">Доставка</h3>
                  <div className="space-y-2">
                    {[{ id: 'pickup', name: 'Самовывоз', icon: MapPin }, { id: 'seller', name: 'Доставка продавца', icon: Truck }, { id: 'yandex', name: 'Яндекс Доставка', icon: Package }, { id: 'dostavista', name: 'Достависта', icon: Clock }].map(d => {
                      const Icon = d.icon;
                      const disabled = paymentMethod === 'Наличные' && (d.id === 'yandex' || d.id === 'dostavista');
                      return (
                        <label key={d.id} className={`flex items-center p-3 border-2 rounded-xl cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${deliveryMethod === d.id ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200'}`}>
                          <input type="radio" name="del" disabled={disabled} checked={deliveryMethod === d.id} onChange={() => setDeliveryMethod(d.id)} className="text-[#5FC36C]" />
                          <Icon className="w-4 h-4 ml-3 mr-2 text-gray-500" />
                          <span className="font-bold text-sm">{d.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {isThirdPartyDelivery && (
                  <div className="bg-[#F4F9F4] p-5 rounded-2xl border border-[#E3F2E3] mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-[#5FC36C]" />
                      <span className="font-bold text-gray-900">Расчет доставки</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                      <span>Служба доставки:</span>
                      <span className="font-bold">{deliveryMethod === 'yandex' ? 'Яндекс Доставка' : 'Достависта'}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                      <span>Стоимость:</span>
                      <span className="font-black text-lg text-gray-900">{deliveryCost} ₽</span>
                    </div>
                    <div className="flex items-start gap-2 mt-3 text-xs text-gray-500 font-medium">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Оплачивается отдельно водителю при получении (или курьеру). Стоимость указана демонстративно.</span>
                    </div>
                  </div>
                )}

                {isThirdPartyDelivery && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" /><p className="text-xs text-yellow-800 font-medium">Доставка сторонними сервисами оплачивается за счет Покупателя. Стоимость будет согласована после оформления.</p></div>}

                <div className="border-t border-gray-100 pt-6 space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Товары:</span>
                    <span>{selectedTotal} ₽</span>
                  </div>
                  {deliveryCost > 0 && (
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Доставка:</span>
                      <span>{deliveryCost} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                    <span className="text-lg font-bold">Итого к оплате</span>
                    <span className="text-3xl font-black">{finalTotal} ₽</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout} 
                  disabled={!isContractSigned || !isRequisitesFilled}
                  className={`w-full py-4 rounded-xl font-black text-lg transition-colors ${
                    isContractSigned && isRequisitesFilled
                      ? 'bg-[#5FC36C] text-white hover:bg-[#4CAF50] shadow-lg shadow-green-500/20' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isContractSigned && isRequisitesFilled ? 'Оформить заказ' : 'Требуется договор / реквизиты'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvoiceModal && invoiceData && <InvoiceTemplate data={invoiceData} onClose={() => { setShowInvoiceModal(false); setOrderSuccess(true); }} />}
    </div>
  );
}