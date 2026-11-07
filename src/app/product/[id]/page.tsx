'use client';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

function ProductContent() {
  const { id } = useParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) {
        setProduct(data);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-black bg-[#F7F4EF]">Загрузка...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-2xl font-black bg-[#F7F4EF]">Товар не найден</div>;

  const galleryArray = product.gallery_images ? product.gallery_images.split(',') : [];
  const allImages = [product.image_url, ...galleryArray].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-black font-sans pb-20">
      <header className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.back()} className="text-sm font-bold bg-white border-4 border-black px-4 py-2 rounded-full hover:bg-gray-100 shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Назад
          </button>
          <Link href="/" className="text-2xl font-black uppercase tracking-tighter">Pyro.</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8">
        <div className="bg-white rounded-3xl p-6 md:p-10 border-4 border-black shadow-[8px_8px_0px_#000] grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div className="w-full aspect-square rounded-2xl border-4 border-black overflow-hidden bg-gray-100 relative mb-4 group">
               {product.image_url ? (
                 <img src={product.image_url} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">Нет фото</div>
               )}
               {product.video_url && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveVideo(product.video_url)} className="bg-white text-black p-5 rounded-full border-4 border-black shadow-[4px_4px_0px_#000] hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
               )}
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {allImages.map((img, idx) => (
                  <div key={idx} onClick={() => setActiveImage(img)} className="aspect-square rounded-xl border-4 border-black overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="text-4xl font-black uppercase leading-tight mb-4">{product.name}</h1>
            <div className="flex gap-4 mb-6">
              <span className={`inline-block text-sm font-black uppercase tracking-wider px-4 py-2 border-4 border-black rounded-xl ${product.stock > 0 ? 'bg-[#4A9EDE] text-white' : 'bg-[#F2A5A5] text-black'}`}>
                {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
              </span>
              <span className="inline-block text-sm font-black uppercase tracking-wider px-4 py-2 border-4 border-black rounded-xl bg-white">
                {product.source}
              </span>
            </div>
            <div className="text-5xl font-black mb-8">{product.price} ₽</div>
            {product.description && (
              <div className="mb-8">
                <h3 className="text-xl font-black uppercase mb-2">Описание</h3>
                <p className="font-bold text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            {product.characteristics && (
              <div className="mb-8">
                <h3 className="text-xl font-black uppercase mb-2">Характеристики</h3>
                <div className="bg-[#F7F4EF] p-4 rounded-xl border-4 border-black font-bold whitespace-pre-wrap">{product.characteristics}</div>
              </div>
            )}
            <div className="mt-auto pt-6">
              <button disabled={product.stock === 0} className="w-full bg-[#EB5534] text-white py-5 rounded-2xl font-black text-xl uppercase tracking-wider border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 disabled:shadow-none disabled:translate-y-0">
                {product.stock > 0 ? 'Добавить в корзину' : 'Ожидается'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <button onClick={() => setActiveVideo(null)} className="absolute top-6 right-6 bg-white text-black p-3 rounded-full border-4 border-black shadow-[4px_4px_0px_#000] hover:scale-110 transition-transform z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl border-4 border-white overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]">{renderVideo(activeVideo)}</div>
        </div>
      )}

      {activeImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveImage(null)}>
          <img src={activeImage} className="max-w-full max-h-full rounded-xl border-4 border-white" />
        </div>
      )}
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-2xl font-black bg-[#F7F4EF]">Загрузка...</div>}>
      <ProductContent />
    </Suspense>
  );
}