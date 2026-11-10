'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'en' | 'zh';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // --- Header ---
    search: 'Искать товары...',
    find: 'Найти',
    profile: 'Профиль',
    orders: 'Заказы',
    favorites: 'Избранное',
    cart: 'Корзина',
    lang_currency: 'Язык и валюта',
    
    // --- Modal ---
    save: 'Сохранить',
    language: 'Язык',
    currency: 'Валюта',
    currency_note: 'Ориентировочную стоимость покажем в выбранной валюте, а фактическую рассчитаем в рублях.',
    
    // --- Catalog (Shop) ---
    all_products: 'Все товары',
    filters: 'Фильтры:',
    all_categories: 'Все категории',
    all_brands: 'Все бренды',
    price_to: 'Цена до...',
    reset: 'Сбросить всё',
    search_results: 'Результаты поиска:',
    nothing_found: 'Ничего не найдено',
    nothing_found_desc: 'Попробуйте изменить запрос или сбросить фильтры',
    in_stock: 'В наличии',
    out_of_stock: 'Нет в наличии',
    add_to_cart: 'В корзину',
    
    // --- Product Page ---
    back: 'Назад',
    description: 'Описание',
    characteristics: 'Характеристики',
    qty: 'шт.',
    
    // --- Cart ---
    cart_title: 'Корзина',
    select_all: 'Выбрать все',
    items_count: 'товаров',
    delete: 'Удалить',
    order_summary: 'Сумма заказа',
    selected_items: 'Выбрано товаров',
    total: 'Итого',
    checkout: 'Перейти к оформлению',
    empty_cart: 'Корзина пуста',
    checkout_title: 'Оформление заказа',
    payment_method: 'Способ оплаты',
    pay_invoice: 'Оплата по счету',
    pay_invoice_desc: 'Счет сформируется автоматически',
    pay_card: 'Онлайн-оплата картой',
    pay_card_desc: 'Безопасная оплата на сайте',
    pay_cash: 'Наличными при получении',
    confirm: 'Подтвердить',
    back_btn: 'Назад',
    
    // --- Orders ---
    orders_title: 'Заказы',
    active_orders: 'Актуальные',
    completed_orders: 'Завершенные',
    no_active_orders: 'У вас пока нет актуальных заказов',
    no_completed_orders: 'У вас пока нет завершенных заказов',
    go_shopping: 'К покупкам',
    order_num: 'Заказ №',
    payment: 'Оплата:',
    
    // --- Profile ---
    profile_title: 'Профиль',
    contact_phone: 'Контактный телефон',
    not_filled: 'Не заполнен',
    my_requisites: 'Мои реквизиты',
    my_documents: 'Мои документы',
    logout: 'Выйти из аккаунта',
    organization: 'Организация',

    // --- Documents ---
    docs_title: 'Мои документы',
    invoice_num: 'Счет №',
    date: 'Дата',
    amount: 'Сумма',
    status: 'Статус',
    actions: 'Действия',
    open: 'Открыть',
    no_docs: 'У вас пока нет счетов.',
    
    // --- Settings ---
    settings_title: 'Мои реквизиты',
    org_name: 'Название организации / ИП',
    inn: 'ИНН',
    kpp: 'КПП',
    ogrn: 'ОГРН / ОГРНИП',
    address: 'Юридический адрес',
    save_changes: 'Сохранить изменения',
    saving: 'Сохранение...',
    
    // --- Common ---
    loading: 'Загрузка...',
  },
  en: {
    // --- Header ---
    search: 'Search products...',
    find: 'Find',
    profile: 'Profile',
    orders: 'Orders',
    favorites: 'Favorites',
    cart: 'Cart',
    lang_currency: 'Language & Currency',
    
    // --- Modal ---
    save: 'Save',
    language: 'Language',
    currency: 'Currency',
    currency_note: 'Estimated cost will be displayed in the selected currency. Actual settlement is in RUB.',
    
    // --- Catalog ---
    all_products: 'All Products',
    filters: 'Filters:',
    all_categories: 'All Categories',
    all_brands: 'All Brands',
    price_to: 'Max price...',
    reset: 'Reset all',
    search_results: 'Search results:',
    nothing_found: 'Nothing found',
    nothing_found_desc: 'Try changing your query or resetting filters',
    in_stock: 'In stock',
    out_of_stock: 'Out of stock',
    add_to_cart: 'Add to cart',
    
    // --- Product Page ---
    back: 'Back',
    description: 'Description',
    characteristics: 'Specifications',
    qty: 'pcs.',
    
    // --- Cart ---
    cart_title: 'Shopping Cart',
    select_all: 'Select all',
    items_count: 'items',
    delete: 'Delete',
    order_summary: 'Order Summary',
    selected_items: 'Selected items',
    total: 'Total',
    checkout: 'Proceed to Checkout',
    empty_cart: 'Your cart is empty',
    checkout_title: 'Checkout',
    payment_method: 'Payment Method',
    pay_invoice: 'Bank Transfer (Invoice)',
    pay_invoice_desc: 'Invoice will be generated automatically',
    pay_card: 'Online Card Payment',
    pay_card_desc: 'Secure payment on the website',
    pay_cash: 'Cash on Delivery',
    confirm: 'Confirm',
    back_btn: 'Back',
    
    // --- Orders ---
    orders_title: 'My Orders',
    active_orders: 'Active',
    completed_orders: 'Completed',
    no_active_orders: 'You have no active orders yet',
    no_completed_orders: 'You have no completed orders yet',
    go_shopping: 'Go Shopping',
    order_num: 'Order #',
    payment: 'Payment:',
    
    // --- Profile ---
    profile_title: 'Profile',
    contact_phone: 'Contact Phone',
    not_filled: 'Not specified',
    my_requisites: 'My Details',
    my_documents: 'My Documents',
    logout: 'Log Out',
    organization: 'Organization',

    // --- Documents ---
    docs_title: 'My Documents',
    invoice_num: 'Invoice #',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    actions: 'Actions',
    open: 'Open',
    no_docs: 'You have no invoices yet.',
    
    // --- Settings ---
    settings_title: 'My Details',
    org_name: 'Organization / Sole Proprietor Name',
    inn: 'Tax ID (INN)',
    kpp: 'KPP',
    ogrn: 'OGRN / OGRNIP',
    address: 'Legal Address',
    save_changes: 'Save Changes',
    saving: 'Saving...',
    
    // --- Common ---
    loading: 'Loading...',
  },
  zh: {
    // --- Header ---
    search: '搜索产品...',
    find: '搜索',
    profile: '个人资料',
    orders: '我的订单',
    favorites: '收藏',
    cart: '购物车',
    lang_currency: '语言与货币',
    
    // --- Modal ---
    save: '保存',
    language: '语言',
    currency: '货币',
    currency_note: '预估费用将以所选货币显示，实际结算以卢布为准。',
    
    // --- Catalog ---
    all_products: '所有产品',
    filters: '筛选：',
    all_categories: '所有类别',
    all_brands: '所有品牌',
    price_to: '最高价格...',
    reset: '重置',
    search_results: '搜索结果：',
    nothing_found: '未找到结果',
    nothing_found_desc: '请尝试更改搜索词或重置筛选条件',
    in_stock: '有货',
    out_of_stock: '缺货',
    add_to_cart: '加入购物车',
    
    // --- Product Page ---
    back: '返回',
    description: '产品描述',
    characteristics: '规格参数',
    qty: '件',
    
    // --- Cart ---
    cart_title: '购物车',
    select_all: '全选',
    items_count: '件商品',
    delete: '删除',
    order_summary: '订单汇总',
    selected_items: '已选商品',
    total: '总计',
    checkout: '去结算',
    empty_cart: '购物车是空的',
    checkout_title: '结算',
    payment_method: '支付方式',
    pay_invoice: '银行转账（发票）',
    pay_invoice_desc: '发票将自动生成',
    pay_card: '在线刷卡支付',
    pay_card_desc: '网站安全支付',
    pay_cash: '货到付款',
    confirm: '确认',
    back_btn: '返回',
    
    // --- Orders ---
    orders_title: '我的订单',
    active_orders: '当前订单',
    completed_orders: '已完成订单',
    no_active_orders: '您还没有当前订单',
    no_completed_orders: '您还没有已完成订单',
    go_shopping: '去购物',
    order_num: '订单号 #',
    payment: '支付方式：',
    
    // --- Profile ---
    profile_title: '个人资料',
    contact_phone: '联系电话',
    not_filled: '未填写',
    my_requisites: '我的信息',
    my_documents: '我的文件',
    logout: '退出登录',
    organization: '组织',

    // --- Documents ---
    docs_title: '我的文件',
    invoice_num: '发票号 #',
    date: '日期',
    amount: '金额',
    status: '状态',
    actions: '操作',
    open: '打开',
    no_docs: '您目前没有发票。',
    
    // --- Settings ---
    settings_title: '我的信息',
    org_name: '组织/个体经营者名称',
    inn: '税号 (INN)',
    kpp: 'KPP',
    ogrn: 'OGRN / OGRNIP',
    address: '法定地址',
    save_changes: '保存更改',
    saving: '保存中...',
    
    // --- Common ---
    loading: '加载中...',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('ru');

  useEffect(() => {
    const savedLang = localStorage.getItem('pyro_lang') as Language;
    if (savedLang && ['ru', 'en', 'zh'].includes(savedLang)) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('pyro_lang', newLang);
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}