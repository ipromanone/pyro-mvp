'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Toast from '../../components/Toast';
import ShopHeader from '../../components/ShopHeader';
import Footer from '../../components/Footer';
import CustomSelect from '../../components/CustomSelect';
import Onboarding from '../../components/Onboarding';
import UnitSelectModal from '../../components/UnitSelectModal';
import { loadCartFromDB, loadFavoritesFromDB, saveCartToDB, toggleFavoriteInDB } from '../../utils/cartHelpers';
import { Heart, ShoppingCart, Search, Filter, LayoutGrid, List, Grid3X3, Grid2X2, Check, ArrowRight } from 'lucide-react';

export default function Shop() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [clientOrg, setClientOrg] = useState<any>(null);
  const [activePromo, setActivePromo] = useState<any>(null);
  
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [viewMode, setViewMode] = useState<'grid4' | 'grid6' | 'grid8' | 'list'>('grid4');

  const [cart, setCart] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<any>(null);

  useEffect(() => {
    const onboardingDone = localStorage.getItem('pyro_onboarding');
    if (!onboardingDone) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      setUserId(session.user.id);
      setIsAuthorized(true);

      const [clientRes, productsRes, promoRes, cartRes, favRes] = await Promise.all([
        supabase.from('organizations').select('*').eq('user_id', session.user.id).limit(1),
        supabase.from('products').select('*'),
        supabase.from('promotions').select('*').eq('is_active', true).limit(1),
        loadCartFromDB(session.user.id),
        loadFavoritesFromDB(session.user.id)
      ]);

      if (clientRes.data && clientRes.data.length > 0) setClientOrg(clientRes.data[0]);
      if (productsRes.data) setAllProducts(productsRes.data);
      if (promoRes.data && promoRes.data.length > 0) setActivePromo(promoRes.data[0]);
      
      setCart(cartRes);
      setFavorites(favRes);
      
      setLoading(false);
    }
    init();
  }, [router]);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;
    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);
    await toggleFavoriteInDB(userId, id, isFav);
  };

  const handleAddFromModal = async (unitType: 'piece' | 'pack' | 'box', totalPieces: number) => {
    if (!userId || !selectedProductForModal) return;
    
    const id = selectedProductForModal.id;
    const currentCart = [...cart];
    const existingIndex = currentCart.findIndex(item => item.product_id === id && item.unit_type === unitType);
    
    if (existingIndex >= 0) {
      currentCart[existingIndex].quantity += totalPieces;
    } else {
      currentCart.push({ product_id: id, quantity: totalPieces, unit_type: unitType });
    }
    
    setCart(currentCart);
    await saveCartToDB(userId, currentCart);
    setSelectedProductForModal(null);
    setToast({ message: 'Товар добавлен в корзину', type: 'success' });
  };

  const getCartItemsText = (productId: string) => {
    const items = cart.filter(item => item.product_id === productId);
    if (items.length === 0) return null;

    const texts = items.map(item => {
      const unitName = item.unit_type === 'piece' ? 'шт.' : item.unit_type === 'pack' ? 'блок.' : 'ящ.';
      return `${item.quantity} ${unitName}`;
    });

    return texts.join(', ');
  };

  const handleQuickAdd = (product: any) => {
    setSelectedProductForModal(product);
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

  const getCartTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (!isAuthorized || loading) return <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900"></div>;

  const gridCols = 
    viewMode === 'grid4' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 
    viewMode === 'grid6' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6' : 
    'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8';

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 text-[#1A1A1A] dark:text-white font-sans pb-20 transition-colors duration-300">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {showOnboarding && (
        <Onboarding 
          onComplete={() => {
            localStorage.setItem('pyro_onboarding', 'true');
            setShowOnboarding(false);
          }}
          onGoToSettings={() => {
            localStorage.setItem('pyro_onboarding', 'true');
            setShowOnboarding(false);
            router.push('/shop/settings');
          }}
        />
      )}

      {selectedProductForModal && (
        <UnitSelectModal 
          product={selectedProductForModal} 
          onClose={() => setSelectedProductForModal(null)} 
          onAdd={handleAddFromModal} 
        />
      )}

      <ShopHeader 
        cartCount={getCartTotalItems()} 
        favoritesCount={favorites.length} 
        clientName={clientOrg?.name || 'Профиль'} 
        searchTerm={searchInput} 
        onSearchChange={setSearchInput} 
        onSearchSubmit={(val: string) => setSearchQuery(val)}
      />

      <div className="max-w-[1440px] mx-auto px-8 pt-8 flex flex-col lg:flex-row gap-10">
        
        <aside className="w-full lg:w-72 flex-shrink-0 relative z-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-[#5FC36C]" />
              <h3 className="text-lg font-black">Фильтры</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Категория</label>
                <CustomSelect 
                  value={filterCategory}
                  onChange={setFilterCategory}
                  options={categoryOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Цена до, ₽</label>
                <input 
                  type="number" 
                  placeholder="Например, 5000" 
                  value={filterPriceMax} 
                  onChange={e => setFilterPriceMax(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#5FC36C] focus:ring-1 focus:ring-[#5FC36C] transition-all text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500" 
                />
              </div>

              <button 
                onClick={() => { setFilterCategory(''); setFilterPriceMax(''); setSearchInput(''); setSearchQuery(''); }} 
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-grow">
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

          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-black">Каталог товаров</h2>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Найдено: {filteredProducts.length}</span>
              
              <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                <button onClick={() => setViewMode('grid4')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid4' ? 'bg-[#E3F2E3] dark:bg-green-900/30 text-[#5FC36C]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="4 в ряд"><Grid2X2 className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('grid6')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid6' ? 'bg-[#E3F2E3] dark:bg-green-900/30 text-[#5FC36C]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="6 в ряд"><Grid3X3 className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('grid8')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid8' ? 'bg-[#E3F2E3] dark:bg-green-900/30 text-[#5FC36C]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="8 в ряд"><LayoutGrid className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#E3F2E3] dark:bg-green-900/30 text-[#5FC36C]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Список (прайс)"><List className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          {viewMode !== 'list' ? (
            <div className={`grid gap-6 ${gridCols}`}>
              {filteredProducts.map((product) => {
                const cartText = getCartItemsText(product.id);
                const isFav = favorites.includes(product.id);
                const hasDiscount = product.old_price && product.old_price > product.price;
                
                const isCompact = viewMode === 'grid6' || viewMode === 'grid8';

                return (
                  <div key={product.id} className="relative group flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                    
                    {/* Ссылка на всю карточку (кроме кнопок) */}
                    <Link href={`/product/${product.id}`} className="absolute inset-0 z-0" />

                    <div className={`relative bg-gray-50 dark:bg-gray-700/50 overflow-hidden ${isCompact ? 'aspect-square' : 'aspect-[3/4]'} z-10 pointer-events-none`}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">Нет фото</div>
                      )}
                      
                      {hasDiscount && !isCompact && (
                        <div className="absolute top-2 left-2 bg-[#F51167] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                          Скидка
                        </div>
                      )}

                      <button 
                        onClick={(e) => toggleFavorite(e, product.id)} 
                        className={`absolute top-2 right-2 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110 pointer-events-auto ${isFav ? 'text-[#5FC36C]' : 'text-gray-400 hover:text-[#5FC36C]'}`}
                      >
                        <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className={`p-3 flex flex-col flex-grow relative z-10 ${isCompact ? 'p-2' : 'p-3'}`}>
                      {!isCompact && (
                        <div className="mb-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{product.brand || 'Бренд'}</span>
                        </div>
                      )}
                      
                      <h2 className={`font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#5FC36C] transition-colors ${isCompact ? 'text-[11px] mb-1' : 'text-base mb-2'}`}>
                        {product.name}
                      </h2>
                      
                      {!isCompact && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.units_per_pack && (
                            <span className="text-[10px] text-[#5FC36C] font-black bg-[#E3F2E3] dark:bg-green-900/30 px-1.5 py-0.5 rounded-md">
                              Блок: {product.units_per_pack} шт.
                            </span>
                          )}
                          {product.units_per_box && (
                            <span className="text-[10px] text-[#5FC36C] font-black bg-[#E3F2E3] dark:bg-green-900/30 px-1.5 py-0.5 rounded-md">
                              Ящик: {product.units_per_box} шт.
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto">
                        <div className={`flex items-baseline gap-2 mb-3 ${isCompact ? 'mb-2' : 'mb-3'}`}>
                          <span className={`font-black text-gray-900 dark:text-white ${isCompact ? 'text-sm' : 'text-xl'}`}>{product.price} ₽</span>
                          {hasDiscount && !isCompact && (
                            <span className="text-xs font-bold text-gray-400 line-through decoration-gray-300">{product.old_price} ₽</span>
                          )}
                        </div>

                        {cartText ? (
                          <div className="flex flex-col gap-2 relative z-20">
                            <div 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push('/shop/cart'); }}
                              className="w-full bg-[#E3F2E3] dark:bg-green-900/30 text-[#5FC36C] border-2 border-[#5FC36C] rounded-lg py-2 px-2 flex items-center justify-between hover:bg-[#d0ebd0] dark:hover:bg-green-900/50 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <Check className="w-4 h-4 shrink-0" />
                                <span className="font-bold text-[11px] truncate leading-tight">
                                  {cartText} в корзине
                                </span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
                            </div>
                            
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickAdd(product); }}
                              className="w-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 rounded-lg py-1.5 font-bold text-[11px] hover:border-[#5FC36C] hover:text-[#5FC36C] transition-colors flex items-center justify-center gap-1"
                            >
                              + Добавить еще
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProductForModal(product); }} 
                            disabled={product.stock === 0} 
                            className={`w-full bg-[#5FC36C] text-white rounded-lg font-bold hover:bg-[#4CAF50] disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 transition-all shadow-sm flex items-center justify-center gap-1 relative z-20 ${isCompact ? 'py-1.5 text-[11px]' : 'py-2.5 text-sm'}`}
                          >
                            <ShoppingCart className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} />
                            {product.stock > 0 ? 'В корзину' : 'Нет'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Фото</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Наименование</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Бренд</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Категория</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Остаток</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400 text-right">Цена</th>
                    <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const cartText = getCartItemsText(product.id);
                    const isFav = favorites.includes(product.id);
                    return (
                      <tr key={product.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-12 h-16 object-cover rounded-lg border border-gray-100 dark:border-gray-600" />
                          ) : (
                            <div className="w-12 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-[8px] font-bold text-gray-400">Нет</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/product/${product.id}`} className="font-bold text-gray-900 dark:text-white hover:text-[#5FC36C] transition-colors">
                            {product.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">{product.brand || '—'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">{product.category || '—'}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{product.stock} шт.</td>
                        <td className="px-6 py-4 text-right font-black text-lg text-gray-900 dark:text-white">{product.price} ₽</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={(e) => toggleFavorite(e, product.id)} className={`p-2 rounded-lg transition-colors ${isFav ? 'text-[#5FC36C]' : 'text-gray-400 hover:text-[#5FC36C]'}`}>
                              <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
                            </button>
                            
                            {cartText ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => router.push('/shop/cart')} 
                                  className="bg-[#E3F2E3] dark:bg-green-900/30 text-[#5FC36C] font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[#d0ebd0] dark:hover:bg-green-900/50"
                                >
                                  {cartText} в корзине
                                </button>
                                <button onClick={(e) => { e.preventDefault(); handleQuickAdd(product); }} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 w-8 h-8 flex items-center justify-center rounded-lg hover:border-[#5FC36C] hover:text-[#5FC36C] font-bold">+</button>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => { e.preventDefault(); setSelectedProductForModal(product); }} 
                                disabled={product.stock === 0}
                                className="bg-[#5FC36C] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#4CAF50] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
                              >
                                В корзину
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredProducts.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-16 text-center border border-gray-100 dark:border-gray-700 mt-6 shadow-sm flex flex-col items-center justify-center transition-colors">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Ничего не найдено</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}