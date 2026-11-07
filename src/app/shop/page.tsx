'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Shop() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [filterSpecCaliber, setFilterSpecCaliber] = useState<string>('');
  const [filterSpecShots, setFilterSpecShots] = useState<string>('');
  const [filterSpecEffects, setFilterSpecEffects] = useState<string>('');
  const [filterSpecFilling, setFilterSpecFilling] = useState<string>('');
  const [filterSpecSize, setFilterSpecSize] = useState<string>('');

  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [isCheckout, setIsCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role) {
      router.push('/'); 
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (!error) setAllProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filteredProducts = allProducts.filter(p => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    
    if (filterPriceMax && filterPriceMax.trim() !== '') {
      if (p.price > parseInt(filterPriceMax)) return false;
    }
    
    if (p.specs) {
      if (filterSpecCaliber && p.specs['Калибр'] !== filterSpecCaliber) return false;
      if (filterSpecShots && p.specs['Залпы'] !== filterSpecShots) return false;
      if (filterSpecEffects && p.specs['Эффекты'] !== filterSpecEffects) return false;
      if (filterSpecFilling && p.specs['Наполнение'] !== filterSpecFilling) return false;
      if (filterSpecSize && p.specs['Размер'] !== filterSpecSize) return false;
    }
    return true;
  });

  const addToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) { newCart[productId] -= 1; } else { delete newCart[productId]; }
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const product = allProducts.find(p => p.id === id);
    return total + (product ? product.price * qty : 0);
  }, 0);

  const submitOrder = async () => {
    if (!customerName || !customerPhone) return alert('Заполните имя и телефон');
    setIsSubmitting(true);
    const { data: orderData, error: orderError } = await supabase.from('orders').insert([{ customer_name: customerName, customer_phone: customerPhone, total_price: cartTotal }]).select().single();
    if (orderError || !orderData) { alert('Ошибка'); setIsSubmitting(false); return; }
    
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const product = allProducts.find(p => p.id === id);
      return { order_id: orderData.id, product_id: id, quantity: qty, price: product?.price || 0 };
    });

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) { alert('Ошибка'); } else { setOrderSuccess(true); setCart({}); setIsCheckout(false); }
    setIsSubmitting(false);
  };

  const renderVideo = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') ? url.split('/').pop() : new URL(url).searchParams.get('v');
      return <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} allowFullScreen />;
    }
    if (url.includes('rutube.ru')) {
       const videoId = url.split('/').pop()?.split('?')[0];
       return <iframe className="w-full h-full" src={`https://rutube.ru/play/embed/${videoId}`} allowFullScreen />;
    }
    return <video src={url} controls autoPlay className="w-full h-full object-contain" />;
  };

  if (!isAuthorized) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold bg-[#F7F4EF] text-black">Загрузка...</div>;
  
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EF] p-4 font-sans text-black">
        <div className="bg-white p-10 rounded-3xl shadow-[8px_8px_0px_#000] border-4 border-black text-center max-w-md w-full">
          <h1 className="text-3xl font-black mb-2 uppercase">Заказ принят!</h1>
          <button onClick={() => setOrderSuccess(false)} className="w-full mt-6 bg-[#EB5534] text-white py-4 rounded-xl font-black uppercase border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000]">Вернуться в каталог</button>
        </div>
      </div>
    );
  }

  if (isCheckout) {
    return (
      <main className="min-h-screen bg-[#F7F4EF] p-4 flex justify-center items-center font-sans text-black">
        <div className="bg-white p-8 rounded-3xl shadow-[8px_8px_0px_#000] border-4 border-black w-full max-w-md">
          <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter">Оформление</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Иван" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-3 font-bold focus:outline-none" />
            <input type="text" placeholder="+7 999 000 00 00" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-3 font-bold focus:outline-none" />
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={() => setIsCheckout(false)} className="flex-1 bg-white text-black py-4 rounded-xl font-black border-4 border-black hover:bg-gray-100">Назад</button>
            <button onClick={submitOrder} className="flex-1 bg-[#4A9EDE] text-white py-4 rounded-xl font-black border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000]">Готово</button>
          </div>
        </div>
      </main>
    );
  }

  const brands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean)));
  const calibers = Array.from(new Set(allProducts.filter(p => p.category === 'Салют' && p.specs?.['Калибр']).map(p => p.specs['Калибр'])));
  const shots = Array.from(new Set(allProducts.filter(p => p.category === 'Салют' && p.specs?.['Залпы']).map(p => p.specs['Залпы'])));
  const effects = Array.from(new Set(allProducts.filter(p => p.category === 'Салют' && p.specs?.['Эффекты']).map(p => p.specs['Эффекты'])));
  const fillings = Array.from(new Set(allProducts.filter(p => p.category === 'Хлопушка' && p.specs?.['Наполнение']).map(p => p.specs['Наполнение'])));
  const sizes = Array.from(new Set(allProducts.filter(p => p.category === 'Бенгальский огонь' && p.specs?.['Размер']).map(p => p.specs['Размер'])));

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-black font-sans pb-32 relative">
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <span className="text-3xl font-black uppercase tracking-tighter">Pyro.</span>
        
        <div className="flex gap-4 items-center">
          <span className="text-sm font-black uppercase tracking-wider text-gray-500">Клиентский магазин</span>
          <button onClick={() => { localStorage.removeItem('userRole'); router.push('/'); }} className="text-xs font-bold bg-white border-2 border-black px-4 py-2 rounded-xl hover:bg-gray-100">Выйти</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-8 relative z-10">
        
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-3xl border-4 border-black shadow-[6px_6px_0px_#000]">
            <h3 className="text-xl font-black uppercase mb-4">Фильтры</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Категория</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                  <option value="">Все</option>
                  <option value="Салют">Салют</option>
                  <option value="Хлопушка">Хлопушка</option>
                  <option value="Бенгальский огонь">Бенгальский огонь</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Бренд</label>
                <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                  <option value="">Все</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {filterCategory === 'Салют' && (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1">Калибр</label>
                    <select value={filterSpecCaliber} onChange={e => setFilterSpecCaliber(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                      <option value="">Любой</option>
                      {calibers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Залпы</label>
                    <select value={filterSpecShots} onChange={e => setFilterSpecShots(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                      <option value="">Любое</option>
                      {shots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Эффекты</label>
                    <select value={filterSpecEffects} onChange={e => setFilterSpecEffects(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                      <option value="">Любое</option>
                      {effects.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </>
              )}

              {filterCategory === 'Хлопушка' && (
                <div>
                  <label className="block text-sm font-bold mb-1">Наполнение</label>
                  <select value={filterSpecFilling} onChange={e => setFilterSpecFilling(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                    <option value="">Любое</option>
                    {fillings.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}

              {filterCategory === 'Бенгальский огонь' && (
                <div>
                  <label className="block text-sm font-bold mb-1">Размер</label>
                  <select value={filterSpecSize} onChange={e => setFilterSpecSize(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                    <option value="">Любой</option>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-1">Цена до (₽)</label>
                <input 
                  type="number" 
                  placeholder="Без ограничений" 
                  value={filterPriceMax} 
                  onChange={e => setFilterPriceMax(e.target.value)} 
                  className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none placeholder:font-normal placeholder:text-gray-400" 
                />
              </div>

              <button onClick={() => {
                setFilterCategory(''); setFilterBrand(''); setFilterPriceMax('');
                setFilterSpecCaliber(''); setFilterSpecShots(''); setFilterSpecEffects(''); setFilterSpecFilling(''); setFilterSpecSize('');
              }} className="w-full bg-[#F2A5A5] text-black py-2 rounded-xl font-black text-sm border-2 border-black hover:bg-red-300 transition-colors">
                Сбросить фильтры
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {filteredProducts.length === 0 ? (
            <div className="text-center font-bold text-xl mt-10 text-gray-500">По вашему запросу ничего не найдено.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const inCartQty = cart[product.id] || 0;
                return (
                  <Link href={`/product/${product.id}`} key={product.id} className="bg-white rounded-3xl p-4 border-4 border-black shadow-[6px_6px_0px_#000] flex flex-col hover:-translate-y-1 transition-transform duration-200 group">
                    
                    <div className="mb-4 rounded-xl overflow-hidden border-4 border-black bg-gray-100 relative h-40">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-sm">Нет фото</div>
                      )}
                      {product.video_url && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.preventDefault(); setActiveVideo(product.video_url); }} className="bg-white text-black p-2 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] hover:scale-110">
                            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <div className="mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{product.brand} • {product.category}</span>
                        <h2 className="text-lg font-black leading-tight uppercase group-hover:text-[#EB5534] transition-colors line-clamp-2">{product.name}</h2>
                      </div>
                      
                      <div className="mb-2">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-black rounded-md ${product.stock > 0 ? 'bg-[#4A9EDE] text-white' : 'bg-[#F2A5A5] text-black'}`}>
                          {product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет в наличии'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-3 border-t-2 border-black flex items-center justify-between">
                      <span className="text-xl font-black">{product.price} ₽</span>
                      
                      {inCartQty > 0 ? (
                        <div className="flex items-center bg-[#F7F4EF] rounded-lg border-2 border-black overflow-hidden">
                          <button onClick={(e) => removeFromCart(e, product.id)} className="px-2 py-1 font-black hover:bg-gray-200 border-r-2 border-black text-sm">-</button>
                          <span className="font-black px-2 text-sm">{inCartQty}</span>
                          <button onClick={(e) => addToCart(e, product.id)} className="px-2 py-1 font-black hover:bg-gray-200 border-l-2 border-black text-sm">+</button>
                        </div>
                      ) : (
                        <button onClick={(e) => addToCart(e, product.id)} disabled={product.stock === 0} className="bg-[#EB5534] text-white px-4 py-2 rounded-lg font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_#000] transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 disabled:shadow-none disabled:translate-y-0">Взять</button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-8 right-8 left-8 md:left-auto bg-white border-4 border-black text-black p-4 pr-6 rounded-2xl shadow-[8px_8px_0px_#000] flex items-center justify-between md:justify-start gap-8 z-50">
          <div><p className="text-sm font-black text-gray-500 mb-1 uppercase tracking-wider">В корзине</p><p className="font-black text-2xl">{cartTotal} ₽</p></div>
          <button onClick={() => setIsCheckout(true)} className="bg-[#4A9EDE] text-white px-8 py-3 rounded-xl font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all">Заказать</button>
        </div>
      )}
      
      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <button onClick={() => setActiveVideo(null)} className="absolute top-6 right-6 bg-white text-black p-3 rounded-full border-4 border-black shadow-[4px_4px_0px_#000] hover:scale-110 z-10"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl border-4 border-white overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]">{renderVideo(activeVideo)}</div>
        </div>
      )}
    </div>
  );
}