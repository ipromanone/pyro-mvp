'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter, useParams } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import { loadCartFromDB, saveCartToDB, loadFavoritesFromDB, toggleFavoriteInDB } from '../../../utils/cartHelpers';
import { Heart, ShoppingCart } from 'lucide-react';

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [clientOrg, setClientOrg] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const [cartQty, setCartQty] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) setProduct(data);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: clientData } = await supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1);
        if (clientData && clientData.length > 0) setClientOrg(clientData[0]);

        // Загружаем корзину и избранное из БД
        const [cartRes, favRes] = await Promise.all([
          loadCartFromDB(session.user.id),
          loadFavoritesFromDB(session.user.id)
        ]);
        
        setCartQty(cartRes[id] || 0);
        setIsFav(favRes.includes(id));
        
        // Считаем общее количество для шапки
        setCartCount(Object.values(cartRes).reduce((a: number, b: any) => a + Number(b), 0));
        setFavoritesCount(favRes.length);
      }

      setLoading(false);
    }
    if (id) fetchData();
  }, [id]);

  const addToCart = async () => {
    if (!userId) return;
    const currentCart = await loadCartFromDB(userId);
    const newQty = (currentCart[id] || 0) + 1;
    currentCart[id] = newQty;
    
    setCartQty(newQty);
    setCartCount(Object.values(currentCart).reduce((a: number, b: any) => a + Number(b), 0));
    await saveCartToDB(userId, currentCart);
  };

  const removeFromCart = async () => {
    if (!userId) return;
    const currentCart = await loadCartFromDB(userId);
    if (currentCart[id] > 1) currentCart[id] -= 1;
    else delete currentCart[id];
    
    setCartQty(currentCart[id] || 0);
    setCartCount(Object.values(currentCart).reduce((a: number, b: any) => a + Number(b), 0));
    await saveCartToDB(userId, currentCart);
  };

  const toggleFavorite = async () => {
    if (!userId) return;
    const isFavNow = isFav;
    setIsFav(!isFavNow);
    
    // Обновляем счетчик в шапке
    if (isFavNow) setFavoritesCount(prev => prev - 1);
    else setFavoritesCount(prev => prev + 1);
    
    await toggleFavoriteInDB(userId, id, isFavNow);
  };

  const renderVideo = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') ? url.split('/').pop() : new URL(url).searchParams.get('v');
      return <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen />;
    }
    if (url.includes('rutube.ru')) {
       const videoId = url.split('/').pop()?.split('?')[0];
       return <iframe className="w-full h-full" src={`https://rutube.ru/play/embed/${videoId}`} allow="autoplay; encrypted-media" allowFullScreen />;
    }
    return <video src={url} controls autoPlay className="w-full h-full object-contain" />;
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-2xl font-black bg-[#F9FAFB]">Товар не найден</div>;

  const galleryArray = product.gallery_images ? product.gallery_images.split(',') : [];
  const allImages = [product.image_url, ...galleryArray].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      
      <ShopHeader 
        cartCount={cartCount} 
        favoritesCount={favoritesCount} 
        clientName={clientOrg?.name || 'Профиль'} 
      />

      <main className="flex-grow max-w-[1400px] mx-auto px-6 pt-8 pb-20 w-full">
        <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          <div>
            <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-[#F3F4F6] relative mb-4 group">
               {product.image_url ? (
                 <img src={product.image_url} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">Нет фото</div>
               )}
               {product.video_url && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveVideo(product.video_url)} className="bg-white text-black p-5 rounded-full hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
               )}
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {allImages.map((img, idx) => (
                  <div key={idx} onClick={() => setActiveImage(img)} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-100">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-4xl font-black leading-tight">{product.name}</h1>
              <button 
                onClick={toggleFavorite}
                className={`p-2 rounded-full border transition-colors ${isFav ? 'border-[#5FC36C] text-[#5FC36C] bg-green-50' : 'border-gray-200 text-gray-400 hover:text-[#5FC36C]'}`}
              >
                <Heart className="w-6 h-6" fill={isFav ? "currentColor" : "none"} />
              </button>
            </div>
            
            <div className="flex gap-4 mb-8">
              <span className={`inline-block text-sm font-black px-4 py-2 rounded-xl ${product.stock > 0 ? 'bg-[#5FC36C] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
              </span>
              <span className="inline-block text-sm font-bold px-4 py-2 rounded-xl bg-gray-100 text-gray-600">
                {product.source}
              </span>
            </div>

            <div className="text-5xl font-black mb-10">{product.price} ₽</div>

            {product.description && (
              <div className="mb-10">
                <h3 className="text-xl font-black mb-3">Описание</h3>
                <p className="font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.characteristics && (
              <div className="mb-10">
                <h3 className="text-xl font-black mb-3">Характеристики</h3>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-medium whitespace-pre-wrap text-gray-700">
                  {product.characteristics}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6">
              {cartQty > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 p-1 w-32">
                    <button onClick={removeFromCart} className="w-10 h-10 flex items-center justify-center rounded-md bg-white text-gray-600 hover:text-[#5FC36C] shadow-sm font-bold">-</button>
                    <span className="font-bold text-gray-900">{cartQty}</span>
                    <button onClick={addToCart} className="w-10 h-10 flex items-center justify-center rounded-md bg-white text-gray-600 hover:text-[#5FC36C] shadow-sm font-bold">+</button>
                  </div>
                  <button onClick={() => router.push('/shop/cart')} className="flex-grow bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-colors">
                    Перейти в корзину
                  </button>
                </div>
              ) : (
                <button 
                  onClick={addToCart}
                  disabled={product.stock === 0}
                  className="w-full bg-[#5FC36C] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#4CAF50] transition-all disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {product.stock > 0 ? 'Добавить в корзину' : 'Ожидается'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <button onClick={() => setActiveVideo(null)} className="absolute top-6 right-6 bg-white text-black p-3 rounded-full hover:scale-110 transition-transform z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
            {renderVideo(activeVideo)}
          </div>
        </div>
      )}

      {activeImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveImage(null)}>
          <img src={activeImage} className="max-w-full max-h-full rounded-xl" />
        </div>
      )}

    </div>
  );
}