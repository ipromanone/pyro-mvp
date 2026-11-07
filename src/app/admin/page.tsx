'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('Салют');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newSource, setNewSource] = useState('Свой склад');
  const [newDescription, setNewDescription] = useState('');
  const [newCharacteristics, setNewCharacteristics] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  
  const [specCaliber, setSpecCaliber] = useState('30мм');
  const [specShots, setSpecShots] = useState('');
  const [specEffects, setSpecEffects] = useState('');
  const [specFilling, setSpecFilling] = useState('Бумага');
  const [specSize, setSpecSize] = useState('45см');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: productsData } = await supabase.from('products').select('*').order('name');
    setOrders(ordersData || []);
    setProducts(productsData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      let imageUrl = null;
      let videoUrl = null;
      let galleryUrls = '';

      if (imageFile) imageUrl = await uploadFile(imageFile, 'images');
      if (galleryFiles && galleryFiles.length > 0) {
        const uploadPromises = Array.from(galleryFiles).map(file => uploadFile(file, 'gallery'));
        galleryUrls = (await Promise.all(uploadPromises)).join(',');
      }
      if (videoFile) videoUrl = await uploadFile(videoFile, 'videos');
      else if (newVideoUrl) videoUrl = newVideoUrl;

      const specs: any = {};
      if (newCategory === 'Салют') {
        specs['Калибр'] = specCaliber;
        specs['Залпы'] = specShots;
        specs['Эффекты'] = specEffects;
      } else if (newCategory === 'Хлопушка') {
        specs['Наполнение'] = specFilling;
      } else if (newCategory === 'Бенгальский огонь') {
        specs['Размер'] = specSize;
      }

      const { error } = await supabase.from('products').insert([{
        name: newName,
        brand: newBrand,
        category: newCategory,
        price: parseInt(newPrice),
        stock: parseInt(newStock),
        source: newSource,
        description: newDescription,
        characteristics: newCharacteristics,
        specs: specs,
        gallery_images: galleryUrls,
        image_url: imageUrl,
        video_url: videoUrl
      }]);

      if (error) throw error;

      setNewName(''); setNewPrice(''); setNewStock(''); setNewDescription(''); setNewCharacteristics(''); setNewBrand('');
      setSpecShots(''); setSpecEffects('');
      setImageFile(null); setGalleryFiles(null); setVideoFile(null); setNewVideoUrl('');
      fetchData();
      alert('Товар успешно добавлен!');
    } catch (error: any) {
      alert('Ошибка при добавлении: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Удалить этот товар?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-black bg-[#F7F4EF] text-black">Загрузка данных...</div>;

  return (
    <div className="min-h-screen bg-[#F7F4EF] font-sans text-black pb-20">
      <header className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Управление</h1>
          
          <div className="flex gap-2 items-center">
             <Link href="/admin" className="text-sm font-bold bg-[#F7F4EF] border-4 border-black px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">Заказы</Link>
             <Link href="/admin/store" className="text-sm font-bold bg-[#EB5534] text-white border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all">Витрина</Link>
             <button onClick={() => { localStorage.removeItem('userRole'); window.location.href = '/'; }} className="text-sm font-bold bg-[#4A9EDE] text-white border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 font-black text-lg rounded-xl border-4 border-black transition-all ${activeTab === 'orders' ? 'bg-[#EB5534] text-white shadow-[4px_4px_0px_#000]' : 'bg-white text-black hover:bg-gray-100'}`}>Заказы</button>
          <button onClick={() => setActiveTab('products')} className={`px-6 py-3 font-black text-lg rounded-xl border-4 border-black transition-all ${activeTab === 'products' ? 'bg-[#EB5534] text-white shadow-[4px_4px_0px_#000]' : 'bg-white text-black hover:bg-gray-100'}`}>Товары</button>
        </div>

        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_#000] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F4EF] border-b-4 border-black">
                    <th className="px-6 py-4 font-black uppercase text-sm">Дата</th>
                    <th className="px-6 py-4 font-black uppercase text-sm">Клиент</th>
                    <th className="px-6 py-4 font-black uppercase text-sm">Телефон</th>
                    <th className="px-6 py-4 font-black uppercase text-sm">Сумма</th>
                    <th className="px-6 py-4 font-black uppercase text-sm">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b-2 border-gray-200 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{new Date(order.created_at).toLocaleString('ru-RU')}</td>
                      <td className="px-6 py-4 font-black">{order.customer_name}</td>
                      <td className="px-6 py-4 font-medium">{order.customer_phone}</td>
                      <td className="px-6 py-4 font-black text-lg">{order.total_price} ₽</td>
                      <td className="px-6 py-4">
                        <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className={`font-black text-sm px-3 py-2 rounded-lg border-2 border-black cursor-pointer appearance-none ${order.status === 'новый' ? 'bg-[#4A9EDE] text-white' : ''} ${order.status === 'в работе' ? 'bg-yellow-300 text-black' : ''} ${order.status === 'отправлен' ? 'bg-green-400 text-black' : ''} ${order.status === 'отменен' ? 'bg-red-400 text-white' : ''}`}>
                          <option value="новый">Новый</option>
                          <option value="в работе">В работе</option>
                          <option value="отправлен">Отправлен</option>
                          <option value="отменен">Отменен</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center font-bold text-gray-500">Заказов пока нет</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_#000] space-y-4 sticky top-24 max-h-[85vh] overflow-y-auto">
                <h2 className="text-2xl font-black mb-4 uppercase">Новый товар</h2>
                
                <div><label className="block text-sm font-bold mb-1">Название</label><input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none" /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Бренд</label>
                    <input required type="text" placeholder="Например: Joker" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Категория</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none">
                      <option value="Салют">Салют</option>
                      <option value="Хлопушка">Хлопушка</option>
                      <option value="Бенгальский огонь">Бенгальский огонь</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold mb-1">Цена (₽)</label><input required type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-1">Остаток</label><input required type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none" /></div>
                </div>

                <div className="p-4 bg-[#F7F4EF] border-4 border-black rounded-xl space-y-3">
                  <h3 className="font-black uppercase text-sm text-[#EB5534]">Характеристики (обязательно)</h3>
                  
                  {newCategory === 'Салют' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold mb-1">Калибр</label>
                        <select required value={specCaliber} onChange={e => setSpecCaliber(e.target.value)} className="w-full bg-white border-2 border-black rounded-lg p-2 text-sm font-bold focus:outline-none">
                          <option value="20мм">20мм</option>
                          <option value="25мм">25мм</option>
                          <option value="30мм">30мм</option>
                          <option value="40мм">40мм</option>
                          <option value="50мм">50мм</option>
                        </select>
                      </div>
                      <div><label className="block text-xs font-bold mb-1">Кол-во залпов</label><input required type="number" placeholder="Например: 25" value={specShots} onChange={e => setSpecShots(e.target.value)} className="w-full bg-white border-2 border-black rounded-lg p-2 text-sm font-bold focus:outline-none" /></div>
                      <div><label className="block text-xs font-bold mb-1">Кол-во эффектов</label><input required type="number" placeholder="Например: 5" value={specEffects} onChange={e => setSpecEffects(e.target.value)} className="w-full bg-white border-2 border-black rounded-lg p-2 text-sm font-bold focus:outline-none" /></div>
                    </>
                  )}
                  {newCategory === 'Хлопушка' && (
                    <div>
                      <label className="block text-xs font-bold mb-1">Наполнение</label>
                      <select required value={specFilling} onChange={e => setSpecFilling(e.target.value)} className="w-full bg-white border-2 border-black rounded-lg p-2 text-sm font-bold focus:outline-none">
                        <option value="Бумага">Бумага</option>
                        <option value="Фольга">Фольга</option>
                        <option value="Серпантин">Серпантин</option>
                        <option value="Конфетти">Конфетти</option>
                      </select>
                    </div>
                  )}
                  {newCategory === 'Бенгальский огонь' && (
                    <div>
                      <label className="block text-xs font-bold mb-1">Размер</label>
                      <select required value={specSize} onChange={e => setSpecSize(e.target.value)} className="w-full bg-white border-2 border-black rounded-lg p-2 text-sm font-bold focus:outline-none">
                        <option value="15см">15см</option>
                        <option value="30см">30см</option>
                        <option value="45см">45см</option>
                        <option value="60см">60см</option>
                      </select>
                    </div>
                  )}
                </div>

                <div><label className="block text-sm font-bold mb-1">Описание</label><textarea rows={2} value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none"></textarea></div>
                <div><label className="block text-sm font-bold mb-1">Общие характеристики</label><textarea rows={2} value={newCharacteristics} onChange={e => setNewCharacteristics(e.target.value)} className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none"></textarea></div>
                <div><label className="block text-sm font-bold mb-1">Главное фото</label><input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-4 file:border-black file:bg-[#4A9EDE] file:text-white file:font-bold file:uppercase hover:file:bg-[#3b8ecc] cursor-pointer" /></div>
                <div><label className="block text-sm font-bold mb-1">Доп. фото (галерея)</label><input multiple type="file" accept="image/*" onChange={e => setGalleryFiles(e.target.files)} className="w-full text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-4 file:border-black file:bg-[#F7F4EF] file:text-black file:font-bold file:uppercase hover:file:bg-gray-200 cursor-pointer" /></div>
                <div><label className="block text-sm font-bold mb-1">Ссылка на видео</label><input type="text" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#F7F4EF] border-4 border-black rounded-xl p-2 font-bold focus:outline-none" /></div>
                <div><label className="block text-sm font-bold mb-1">Видео (файл)</label><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="w-full text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-4 file:border-black file:bg-[#EB5534] file:text-white file:font-bold file:uppercase hover:file:bg-[#d44a2d] cursor-pointer" /></div>

                <button type="submit" disabled={isAdding} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-wider border-4 border-black hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4">{isAdding ? 'Загрузка...' : 'Добавить'}</button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {products.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] flex gap-4 items-center">
                  {product.image_url ? <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded-xl border-2 border-black" /> : <div className="w-20 h-20 bg-gray-200 rounded-xl border-2 border-black flex items-center justify-center font-bold text-gray-400 text-xs text-center p-1">Нет фото</div>}
                  <div className="flex-grow">
                    <h3 className="font-black text-lg leading-tight uppercase">{product.name}</h3>
                    <p className="font-bold text-gray-600 text-sm">{product.brand} • {product.category} • {product.price} ₽ • Остаток: {product.stock}</p>
                  </div>
                  <button onClick={() => deleteProduct(product.id)} className="bg-red-500 text-white p-3 rounded-xl border-2 border-black hover:bg-red-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}