import { supabase } from '../app/supabase';

// Загружаем корзину как массив строк (каждая строка — отдельная позиция с единицей)
export async function loadCartFromDB(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, product_id, quantity, unit_type')
    .eq('user_id', userId);

  if (error) {
    console.error('Ошибка загрузки корзины:', error);
    return [];
  }

  return data || [];
}

// Сохраняем корзину: удаляем все старые строки и вставляем новые
export async function saveCartToDB(userId: string, cartItems: any[]) {
  // Удаляем все строки пользователя
  await supabase.from('cart_items').delete().eq('user_id', userId);

  if (cartItems.length === 0) return;

  // Вставляем новые
  const rows = cartItems.map(item => ({
    user_id: userId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_type: item.unit_type,
  }));

  await supabase.from('cart_items').insert(rows);
}

// Избранное — без изменений
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