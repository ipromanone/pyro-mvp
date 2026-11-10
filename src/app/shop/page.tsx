'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Toast from '../../components/Toast';
import ShopHeader from '../../components/ShopHeader';
import CustomSelect from '../../components/CustomSelect';
import { Heart, ShoppingCart, Search, Filter } from 'lucide-react';

export default function Shop() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [activePromo, setActivePromo] = useState<any>(null);
  
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('pyro_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    const savedFav = localStorage.getItem('pyro_favorites');
    if (savedFav) setFavorites(JSON.parse(savedFav));
  }, []);

  useEffect(() => {
    localStorage.setItem('pyro_cart', JSON.stringify(cart));
    localStorage.setItem('pyro_favorites', JSON.stringify(favorites));
  }, [cart, favorites]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      setIsAuthorized(true);

      const [clientRes, productsRes, promoRes] = await Promise.all([
        supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1),
        supabase.from('products').select('*'),
        supabase.from('promotions').select('*').eq('is_active', true).limit(1)
      ]);

      if (clientRes.data && clientRes.data.length > 0) setClientOrg(clientRes.data[0]);
      if (productsRes.data) setAllProducts(productsRes.data);
      if (promoRes.data && promoRes.data.length > 0) setActivePromo(promoRes.data[0]);
      
      setLoading(false);
    }
    init();
  }, [router]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const addToCart = (e: React.MouseEvent, id: string) => { 
    e.preventDefault(); 
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 })); 
  };

  const removeFromCart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) newCart[id] -= 1;
      else delete newCart[id];
      return newCart;
    });
  };

  const filteredProducts = allProducts.filter(p => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterPriceMax && filterPriceMax.trim() !== '' && p.price > parseInt(filterPriceMax)) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchString = `${p.name || ''} ${p.description || ''} ${p.characteristics || ''}`.toLowerCase();
      const words = query.split(/\s+/).filter(Boolean);
      const matchesAllWords = words.every(word => searchString.includes(word));
      if (!matchesAllWords) return false;
    }
    
    return true;
  });

  const categoryOptions = [
    { value: '', label: 'Все категории' },
    { value: 'Салют', label: 'Салют' },
    { value: 'Хлопушка', label: 'Хлопушка' },
    { value: 'Бенгальский огонь', label: 'Бенгальский огонь' },
  ];

  if (!isAuthorized || loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ShopHeader 
        cartCount={Object.values(cart).reduce((a, b) => a + b, 0)} 
        favoritesCount={favorites.length} 
        clientName={clientOrg?.name || 'Профиль'} 
        searchTerm={searchInput} 
        onSearchChange={setSearchInput} 
        onSearchSubmit={(val) => setSearchQuery(val)}
        onSuggestionSelect={(val) => {
          setSearchInput(val);
          setSearchQuery(val);
        }}
      />

      <div className="max-w-[1440px] mx-auto px-8 pt-8 flex flex-col lg:flex-row gap-10">
        
        {/* ЛЕВАЯ ПАНЕЛЬ: ФИЛЬТРЫ */}
        <aside className="w-full lg:w-72 flex-shrink-0 relative z-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-[#5FC36C]" />
              <h3 className="text-lg font-black">Фильтры</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Категория</label>
                <CustomSelect 
                  value={filterCategory}
                  onChange={setFilterCategory}
                  options={categoryOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Цена до, ₽</label>
                <input 
                  type="number" 
                  placeholder="Например, 5000" 
                  value={filterPriceMax} 
                  onChange={e => setFilterPriceMax(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#5FC36C] focus:ring-1 focus:ring-[#5FC36C] transition-all" 
                />
              </div>

              <button 
                onClick={() => { setFilterCategory(''); setFilterPriceMax(''); setSearchInput(''); setSearchQuery(''); }} 
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </aside>

        {/* ПРАВАЯ ЧАСТЬ: ТОВАРЫ */}
        <main className="flex-grow">
          
          {/* Баннер акции */}
          {activePromo && (
            <div className="bg-gradient-to-r from-[#5FC36C] to-[#4CAF50] rounded-[2rem] p-8 flex items-center justify-between mb-8 shadow-lg shadow-green-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-white/20 p-4 rounded-2xl text-white backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="font-black text-2xl text-white mb-1">{activePromo.title}</p>
                  <p className="text-sm font-medium text-green-50">{activePromo.description || 'Специальное предложение'}</p>
                </div>
              </div>
              {activePromo.end_date && (
                <span className="bg-white text-[#5FC36C] text-sm font-black px-4 py-2 rounded-xl relative z-10">
                  До {new Date(activePromo.end_date).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          )}

          {/* Заголовок и кол-во товаров */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">Каталог товаров</h2>
            <span className="text-sm font-bold text-gray-500">Найдено: {filteredProducts.length}</span>
          </div>

          {/* Сетка товаров */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const inCartQty = cart[product.id] || 0;
              const isFav = favorites.includes(product.id);
              const hasDiscount = product.old_price && product.old_price > product.price;

              return (
                <Link href={`/product/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 relative">
                  
                  {/* Фото */}
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">Нет фото</div>
                    )}
                    
                    {/* Бейдж скидки */}
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 bg-[#F51167] text-white text-xs font-black px-3 py-1 rounded-lg shadow-md">
                        Скидка
                      </div>
                    )}

                    {/* Кнопка избранного */}
                    <button 
                      onClick={(e) => toggleFavorite(e, product.id)} 
                      className={`absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110 ${isFav ? 'text-[#5FC36C]' : 'text-gray-400 hover:text-[#5FC36C]'}`}
                    >
                      <Heart className="w-5 h-5" fill={isFav ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* Информация */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{product.brand || 'Бренд'}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-[#5FC36C] transition-colors">
                      {product.name}
                    </h2>
                    
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-black text-gray-900">{product.price} ₽</span>
                        {hasDiscount && (
                          <span className="text-sm font-bold text-gray-400 line-through decoration-gray-300">{product.old_price} ₽</span>
                        )}
                      </div>

                      {inCartQty > 0 ? (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 p-1.5">
                          <button onClick={(e) => removeFromCart(e, product.id)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-gray-600 hover:text-[#5FC36C] hover:bg-green-50 shadow-sm font-black text-lg transition-colors">-</button>
                          <span className="font-black text-gray-900">{inCartQty}</span>
                          <button onClick={(e) => addToCart(e, product.id)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-gray-600 hover:text-[#5FC36C] hover:bg-green-50 shadow-sm font-black text-lg transition-colors">+</button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => addToCart(e, product.id)} 
                          disabled={product.stock === 0} 
                          className="w-full bg-[#5FC36C] text-white py-3 rounded-xl font-black text-sm hover:bg-[#4CAF50] disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-md shadow-green-500/20 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {product.stock > 0 ? 'В корзину' : 'Нет в наличии'}
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Пустое состояние */}
          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 mt-6 shadow-sm flex flex-col items-center justify-center">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-black text-gray-900 mb-2">Ничего не найдено</h3>
              <p className="text-gray-500 font-medium">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}