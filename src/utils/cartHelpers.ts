import { supabase } from '../app/supabase';

// --- КОРЗИНА ---
export async function loadCartFromDB(userId: string) {
  const { data, error } = await supabase.from('cart_items').select('product_id, quantity').eq('user_id', userId);
  if (error) { console.error('Ошибка загрузки корзины:', error); return {}; }
  
  const cart: { [key: string]: number } = {};
  data?.forEach(item => { cart[item.product_id] = item.quantity; });
  return cart;
}

export async function saveCartToDB(userId: string, cart: { [key: string]: number }) {
  // 1. Удаляем старые записи
  await supabase.from('cart_items').delete().eq('user_id', userId);
  
  // 2. Вставляем новые
  const items = Object.entries(cart).map(([product_id, quantity]) => ({ user_id: userId, product_id, quantity }));
  if (items.length > 0) {
    await supabase.from('cart_items').insert(items);
  }
}

// --- ИЗБРАННОЕ ---
export async function loadFavoritesFromDB(userId: string) {
  const { data, error } = await supabase.from('favorites').select('product_id').eq('user_id', userId);
  if (error) { console.error('Ошибка загрузки избранного:', error); return []; }
  return data?.map(item => item.product_id) || [];
}

export async function toggleFavoriteInDB(userId: string, productId: string, isFavorite: boolean) {
  if (isFavorite) {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
  } else {
    await supabase.from('favorites').insert({ user_id: userId, product_id: productId });
  }
}