'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import Toast from '../../../components/Toast';
import ShopHeader from '../../../components/ShopHeader';
import InvoiceTemplate from '../../../components/InvoiceTemplate';
import { numberToWords } from '../../../utils/generateInvoice';
import { loadCartFromDB, saveCartToDB } from '../../../utils/cartHelpers';
import { Trash2, MapPin, Truck, Package, Clock, CheckCircle, AlertTriangle, ShoppingCart, FileWarning, CreditCard, Lock, Info, Calculator, Box, Layers, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]); 
  const [selectedItems, setSelectedItems] = useState<string[]>([]); 

  const [clientOrg, setClientOrg] = useState<any>(null);
  const [adminOrg, setAdminOrg] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState('Счет');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [address, setAddress] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [isContractSigned, setIsContractSigned] = useState(false);
  const [isRequisitesFilled, setIsRequisitesFilled] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
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
        setCartItems(dbCart);
        setSelectedItems(dbCart.map((item: any) => item.id));
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

      const cartProductIds = dbCart.map((item: any) => item.product_id);
      if (cartProductIds.length > 0) {
        const { data: productsData } = await supabase.from('products').select('*').in('id', cartProductIds);
        if (productsData && isMounted) setAllProducts(productsData);
      }

      if (isMounted) setProductsLoading(false);
    }

    init();
    return () => { isMounted = false; };
  }, [router]);

  useEffect(() => {
    if (deliveryMethod === 'yandex') setDeliveryCost(500);
    else if (deliveryMethod === 'dostavista') setDeliveryCost(450);
    else setDeliveryCost(0);
  }, [deliveryMethod]);

  useEffect(() => {
    if (paymentMethod === 'Наличные' && (deliveryMethod === 'yandex' || deliveryMethod === 'dostavista')) setDeliveryMethod('pickup');
  }, [paymentMethod, deliveryMethod]);

  const updateCart = async (newItems: any[]) => {
    setCartItems(newItems);
    if (userId) await saveCartToDB(userId, newItems);
  };

  const handleToggleAll = () => {
    if (selectedItems.length === cartItems.length) setSelectedItems([]);
    else setSelectedItems(cartItems.map((item: any) => item.id));
  };

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleUnitChange = async (cartItemId: string, newUnit: string) => {
    const item = cartItems.find(i => i.id === cartItemId);
    if (!item) return;
    const product = allProducts.find(p => p.id === item.product_id);
    if (!product) return;

    let currentMultiplier = 1;
    if (item.unit_type === 'pack' && product.units_per_pack) currentMultiplier = product.units_per_pack;
    if (item.unit_type === 'box' && product.units_per_box) currentMultiplier = product.units_per_box;
    const totalPieces = item.quantity * currentMultiplier;

    let newMultiplier = 1;
    if (newUnit === 'pack' && product.units_per_pack) newMultiplier = product.units_per_pack;
    if (newUnit === 'box' && product.units_per_box) newMultiplier = product.units_per_box;
    const newQuantity = Math.ceil(totalPieces / newMultiplier);

    const newItems = cartItems.map(i =>
      i.id === cartItemId ? { ...i, unit_type: newUnit, quantity: newQuantity } : i
    );
    await updateCart(newItems);
  };

  const handleQuantityInput = async (cartItemId: string, value: string) => {
    const newQty = parseInt(value) || 0;
    if (newQty <= 0) {
      const newItems = cartItems.filter(i => i.id !== cartItemId);
      await updateCart(newItems);
      setSelectedItems(prev => prev.filter(i => i !== cartItemId));
    } else {
      const newItems = cartItems.map(i =>
        i.id === cartItemId ? { ...i, quantity: newQty } : i
      );
      await updateCart(newItems);
    }
  };

  const handleDelete = async (cartItemId: string) => {
    const newItems = cartItems.filter(i => i.id !== cartItemId);
    await updateCart(newItems);
    setSelectedItems(prev => prev.filter(i => i !== cartItemId));
  };

  const selectedTotal = selectedItems.reduce((total, cartItemId) => {
    const item = cartItems.find(i => i.id === cartItemId);
    if (!item) return total;
    const product = allProducts.find(p => p.id === item.product_id);
    if (!product) return total;

    let unitPrice = product.price;
    if (item.unit_type === 'pack' && product.units_per_pack) unitPrice = product.price * product.units_per_pack;
    if (item.unit_type === 'box' && product.units_per_box) unitPrice = product.price * product.units_per_box;

    return total + unitPrice * item.quantity;
  }, 0);

  const finalTotal = selectedTotal + deliveryCost;
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
      customer_name: clientOrg.name,
      customer_phone: clientOrg.contact_phone,
      total_price: finalTotal,
      payment_method: paymentMethod,
      delivery_method: deliveryMethod,
      delivery_address: address,
      delivery_status: deliveryStatus,
      payment_status: paymentStatus
    }]).select().single();

    if (error || !orderData) { setToast({ message: 'Ошибка: ' + error?.message, type: 'error' }); return; }

    const orderItems = selectedItems.map(cartItemId => {
      const item = cartItems.find(i => i.id === cartItemId);
      const p = allProducts.find(prod => prod.id === item?.product_id);
      let displayName = p?.name || '';
      let itemTotal = p?.price || 0;

      if (item.unit_type === 'box' && p?.units_per_box) {
        displayName += ` (Ящик ${p.units_per_box} шт.)`;
        itemTotal = p.price * p.units_per_box;
      } else if (item.unit_type === 'pack' && p?.units_per_pack) {
        displayName += ` (Блок ${p.units_per_pack} шт.)`;
        itemTotal = p.price * p.units_per_pack;
      }

      return {
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: itemTotal,
        product_name: displayName,
        unit_type: item.unit_type
      };
    });

    await supabase.from('order_items').insert(orderItems);

    if (paymentMethod === 'Счет') {
      await supabase.from('invoices').insert([{
        user_id: clientOrg.user_id,
        order_id: orderData.id,
        invoice_number: invoiceNumber,
        amount: finalTotal,
        status: 'Ожидает оплаты',
        admin_org_id: adminOrg?.id || null
      }]);

      setInvoiceData({
        invoiceNumber,
        date: new Date().toLocaleDateString('ru-RU'),
        adminOrg,
        clientOrg,
        items: [
          ...orderItems.map(item => ({ name: item.product_name, quantity: item.quantity, price: item.price })),
          ...(deliveryCost > 0 ? [{ name: `Доставка (${deliveryMethod === 'yandex' ? 'Яндекс' : 'Достависта'})`, quantity: 1, price: deliveryCost }] : [])
        ],
        total: finalTotal,
        totalWords: numberToWords(finalTotal)
      });
      setShowInvoiceModal(true);
    } else {
      setOrderSuccess(true);
    }

    await updateCart([]);
    setSelectedItems([]);
  };

  if (!isAuthorized) return <div className="min-h-screen bg-[#F9FAFB]"></div>;
  if (productsLoading && allProducts.length === 0) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  const enrichedItems = cartItems.map(item => {
    const product = allProducts.find(p => p.id === item.product_id);
    return { ...item, product };
  }).filter(item => item.product);

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
      <ShopHeader cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)} favoritesCount={0} clientName={clientOrg?.name || 'Профиль'} />

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
                  <input type="checkbox" checked={enrichedItems.length > 0 && selectedItems.length === enrichedItems.length} onChange={handleToggleAll} className="w-5 h-5 rounded border-gray-300 text-[#5FC36C] focus:ring-[#5FC36C]" />
                  <span className="font-bold">Выбрать все</span>
                </label>
                <span className="text-sm font-bold text-gray-500">{enrichedItems.length} позиций</span>
              </div>

              {enrichedItems.map(item => (
                <div key={item.id} className="p-6 border-b border-gray-50 last:border-0 flex gap-6 items-start">
                  <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleToggleItem(item.id)} className="w-5 h-5 rounded border-gray-300 text-[#5FC36C] focus:ring-[#5FC36C] mt-2" />

                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-24 h-32 object-cover rounded-xl border border-gray-100" />
                  ) : (
                    <div className="w-24 h-32 bg-gray-100 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold text-center p-2">Нет фото</div>
                  )}

                  <div className="flex-grow">
                    <h3 className="font-bold text-lg line-clamp-2">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">{item.product.brand}</p>

                    <div className="mt-3 flex flex-col gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">Единица:</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleUnitChange(item.id, 'piece')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${item.unit_type === 'piece' ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200 hover:border-gray-300'}`}>
                          Штука
                        </button>
                        {item.product.units_per_pack && (
                          <button onClick={() => handleUnitChange(item.id, 'pack')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${item.unit_type === 'pack' ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200 hover:border-gray-300'}`}>
                            Блок ({item.product.units_per_pack} шт.)
                          </button>
                        )}
                        {item.product.units_per_box && (
                          <button onClick={() => handleUnitChange(item.id, 'box')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${item.unit_type === 'box' ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200 hover:border-gray-300'}`}>
                            Ящик ({item.product.units_per_box} шт.)
                          </button>
                        )}
                      </div>
                    </div>

                    <button onClick={() => handleDelete(item.id)} className="text-sm text-gray-400 hover:text-red-500 mt-3 flex items-center gap-1 font-bold">
                      <Trash2 className="w-4 h-4" /> Удалить
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-2xl font-black">
                      {item.unit_type === 'pack' && item.product.units_per_pack
                        ? item.product.price * item.product.units_per_pack
                        : item.unit_type === 'box' && item.product.units_per_box
                          ? item.product.price * item.product.units_per_box
                          : item.product.price} ₽
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => handleQuantityInput(item.id, String(item.quantity - 1))} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-black font-bold">-</button>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                        className="w-14 text-center font-bold focus:outline-none"
                      />
                      <button onClick={() => handleQuantityInput(item.id, String(item.quantity + 1))} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-black font-bold">+</button>
                    </div>
                    <div className="text-sm text-gray-500 font-bold">{item.quantity} {item.unit_type === 'piece' ? 'шт.' : item.unit_type === 'pack' ? 'блок.' : 'ящ.'}</div>
                  </div>
                </div>
              ))}

              {enrichedItems.length === 0 && (
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

          {enrichedItems.length > 0 && (
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
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setCardNumber(raw.replace(/(\d{4})(?=\d)/g, '$1 '));
                          }}
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
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setCardExpiry(raw.replace(/(\d{2})(?=\d)/, '$1/'));
                            }}
                            placeholder="ММ/ГГ"
                            maxLength={5}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium focus:ring-2 focus:ring-[#5FC36C] outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
                              setCardCvc(raw);
                            }}
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
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
                            setCardName(raw);
                          }}
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

                {/* ССЫЛКА НА СТРАНИЦУ ПОДДЕРЖКИ */}
                <Link 
                  href="/shop/support" 
                  className="w-full mt-4 py-3 text-center text-sm font-bold text-gray-500 hover:text-[#5FC36C] transition-colors flex items-center justify-center gap-2 bg-gray-50 rounded-xl hover:bg-[#E3F2E3]"
                >
                  <MessageSquare className="w-4 h-4" />
                  Возникли вопросы по счету? Напишите нам
                </Link>

              </div>
            </div>
          )}
        </div>
      </div>

      {showInvoiceModal && invoiceData && <InvoiceTemplate data={invoiceData} onClose={() => { setShowInvoiceModal(false); setOrderSuccess(true); }} />}
    </div>
  );
}