// export-tatnet.js — выгружает все таблицы из TatNet в CSV
// Запуск: node export-tatnet.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Данные из панели TatNet
const TATNET_URL = 'https://508acdd888eb4ac5480432c01aa50f02.supa.tatnet.cloud';
const TATNET_ANON_KEY = 'sb_publishable_i4NFC5K18Uuhw84jSd12hlcyS8qs';

const supabase = createClient(TATNET_URL, TATNET_ANON_KEY);

const TABLES = [
  'admin_organizations',
  'organizations',
  'products',
  'promotions',
  'cart_items',
  'favorites',
  'orders',
  'order_items',
  'invoices',
  'notifications',
  'chat_sessions',
  'chat_messages',
];

async function exportTable(table) {
  console.log(`📦 ${table}...`);
  const { data, error } = await supabase.from(table).select('*');
  
  if (error) {
    console.log(`  ⚠️ Ошибка: ${error.message}`);
    return;
  }
  if (!data || data.length === 0) {
    console.log(`  ⏭️ Пусто`);
    return;
  }

  // Преобразуем в CSV
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(values.join(','));
  }

  fs.writeFileSync(`${table}.csv`, csvRows.join('\n'), 'utf8');
  console.log(`  ✅ Сохранено: ${data.length} строк → ${table}.csv`);
}

(async () => {
  console.log('🚀 Начинаю выгрузку из TatNet...\n');
  for (const table of TABLES) {
    await exportTable(table);
  }
  console.log('\n✨ Готово! Все CSV-файлы в папке проекта.');
})();