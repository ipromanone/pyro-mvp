'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import Toast from '../../../components/Toast';
import ShopHeader from '../../../components/ShopHeader';
import InvoiceTemplate from '../../../components/InvoiceTemplate';
import { numberToWords } from '../../../utils/generateInvoice';
import { Trash2, MapPin, Truck, Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [adminOrg, setAdminOrg] = useState<any>(null);
  
  const [paymentMethod, setPaymentMethod] = useState('Счет');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [address, setAddress] = useState('');
  
  const [isCheckout, setIsCheckout] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successDeliveryMethod, setSuccessDeliveryMethod] = useState('');
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const savedCart = localStorage.getItem('pyro_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      setSelectedItems(Object.keys(parsedCart));
    }

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!session) { router.push('/'); return; }
      setIsAuthorized(true);

      const [clientRes, adminRes] = await Promise.all([
        supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1),
        supabase.from('admin_organizations').select('*').eq('is_default', true).single()
      ]);

      if (clientRes.data && clientRes.data.length > 0 && isMounted) {
        setClientOrg(clientRes.data[0]);
        setAddress(clientRes.data[0].address || '');
      }
      if (adminRes.data && isMounted) setAdminOrg(adminRes.data);

      const cartIds = savedCart ? Object.keys(JSON.parse(savedCart)) : [];
      if (cartIds.length > 0) {
        const { data: productsData } = await supabase.from('products').select('*').in('id', cartIds);
        if (productsData && isMounted) setAllProducts(productsData);
      }
      
      if (isMounted) setProductsLoading(false);
    }
    
    init();
    return () => { isMounted = false; };
  }, [router]);

  useEffect(() => {
    if (paymentMethod === 'Наличные' && (deliveryMethod === 'yandex' || deliveryMethod === 'dostavista')) setDeliveryMethod('pickup');
  }, [paymentMethod, deliveryMethod]);

  const updateCart = (newCart: { [key: string]: number }) => {
    setCart(newCart);
    localStorage.setItem('pyro_cart', JSON.stringify(newCart));
  };

  const handleToggleAll = () => {
    if (selectedItems.length === Object.keys(cart).length) setSelectedItems([]);
    else setSelectedItems(Object.keys(cart));
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const newQty = (cart[id] || 0) + delta;
    if (newQty <= 0) {
      const { [id]: _, ...rest } = cart;
      updateCart(rest);
      setSelectedItems(prev => prev.filter(item => item !== id));
    } else {
      updateCart({ ...cart, [id]: newQty });
    }
  };

  const handleDelete = (id: string) => {
    const { [id]: _, ...rest } = cart;
    updateCart(rest);
    setSelectedItems(prev => prev.filter(item => item !== id));
  };

  const selectedTotal = selectedItems.reduce((total, id) => {
    const product = allProducts.find(p => p.id === id);
    return total + (product ? product.price * (cart[id] || 0) : 0);
  }, 0);

  const selectedCount = selectedItems.reduce((count, id) => count + (cart[id] || 0), 0);
  const isThirdPartyDelivery = deliveryMethod === 'yandex' || deliveryMethod === 'dostavista';

  const handleCheckout = async () => {
    if (!clientOrg || !clientOrg.contact_phone) {
      setToast({ message: 'Заполните контактный телефон', type: 'error' });
      return;
    }
    const invoiceNumber = `СЧ-${Math.floor(Math.random() * 10000) + 1000}`;
    const { data: orderData, error } = await supabase.from('orders').insert([{
      customer_name: clientOrg.name, customer_phone: clientOrg.contact_phone, total_price: selectedTotal,
      payment_method: paymentMethod, delivery_method: deliveryMethod, delivery_address: address,
      delivery_status: paymentMethod === 'Счет' ? 'Ожидает оплаты' : 'На сборке'
    }]).select().single();

    if (error || !orderData) { setToast({ message: 'Ошибка: ' + error?.message, type: 'error' }); return; }
    
    await supabase.from('order_items').insert(selectedItems.map(id => {
      const p = allProducts.find(prod => prod.id === id);
      return { order_id: orderData.id, product_id: id, quantity: cart[id], price: p?.price || 0 };
    }));

    if (paymentMethod === 'Счет') {
      await supabase.from('invoices').insert([{
        user_id: clientOrg.user_id, order_id: orderData.id, invoice_number: invoiceNumber,
        amount: selectedTotal, status: 'Ожидает оплаты', admin_org_id: adminOrg?.id || null
      }]);
      setInvoiceData({
        invoiceNumber, date: new Date().toLocaleDateString('ru-RU'), adminOrg, clientOrg,
        items: selectedItems.map(id => ({ name: allProducts.find(p => p.id === id)?.name, quantity: cart[id], price: allProducts.find(p => p.id === id)?.price })),
        total: selectedTotal, totalWords: numberToWords(selectedTotal)
      });
      setIsCheckout(false); setShowInvoiceModal(true); setSuccessDeliveryMethod(deliveryMethod);
    } else {
      setSuccessDeliveryMethod(deliveryMethod); setOrderSuccess(true); setIsCheckout(false);
    }
    updateCart({}); setSelectedItems([]);
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
            <p className="text-gray-600 font-medium mb-8">Мы свяжемся с вами для подтверждения.</p>
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
      
      <div className="flex-grow max-w-[1400px] mx-auto px-6 mt-8 pb-20 w-full">
        <h1 className="text-3xl font-black mb-8">Корзина</h1>
        {/* ... (Здесь должен быть ваш блок с товарами и оформлением, я его пропускаю для краткости, он не меняется) ... */}
      </div>
      
      {showInvoiceModal && invoiceData && <InvoiceTemplate data={invoiceData} onClose={() => { setShowInvoiceModal(false); setOrderSuccess(true); }} />}
    </div>
  );
}