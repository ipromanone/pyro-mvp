'use client';

import Link from 'next/link';
import { User, Package, Heart, ShoppingCart, Search, ChevronDown, Building2, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../app/supabase';
import NotificationBell from './NotificationBell';

export default function ShopHeader({ 
  cartCount, 
  favoritesCount, 
  clientName,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  supportLink = "/shop/support"
}: { 
  cartCount: number, 
  favoritesCount: number, 
  clientName: string,
  searchTerm?: string,
  onSearchChange?: (val: string) => void,
  onSearchSubmit?: (val: string) => void,
  supportLink?: string
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatName = (name: string) => {
    if (!name) return 'Профиль';
    if (!name.startsWith('ИП') && !name.startsWith('ООО') && name.length <= 18) return name;
    const parts = name.split(' ');
    if (parts.length < 3) return name;
    const orgType = parts[0];
    const lastName = parts[1];
    const firstName = parts[2];
    const middleName = parts[3];
    let result = `${orgType} ${lastName}`;
    if (firstName) result += ` ${firstName[0]}.`;
    if (middleName) result += `${middleName[0]}.`;
    return result;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.from('products').select('name').ilike('name', `%${searchTerm}%`).limit(6);
      if (!error && data) {
        const uniqueNames = Array.from(new Set(data.map(item => item.name)));
        setSuggestions(uniqueNames);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = () => {
    setShowSuggestions(false);
    if (onSearchSubmit) onSearchSubmit(searchTerm || '');
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsProfileMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 150);
  };

  const iconWrapper = "flex flex-col items-center justify-center gap-1.5 px-3 h-14 cursor-pointer group";
  const iconStyle = "w-6 h-6 text-gray-500 group-hover:text-[#5FC36C] transition-colors";
  const labelStyle = "text-[11px] font-bold leading-none text-gray-600 group-hover:text-[#5FC36C] transition-colors whitespace-nowrap flex items-center gap-1";

  return (
    <header className="bg-white dark:bg-gray-900 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
        
        <Link href="/shop" className="text-4xl font-black text-black dark:text-white tracking-tighter shrink-0">
          Pyro<span className="text-[#5FC36C]">.</span>
        </Link>

        <div className="flex-grow max-w-3xl relative">
          <div className="relative">
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Искать товары..."
              value={searchTerm || ''}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              className="w-full bg-[#F3F4F6] dark:bg-gray-800 border-2 border-transparent rounded-xl py-3 pl-12 pr-28 focus:outline-none focus:border-[#5FC36C] focus:bg-white dark:focus:bg-gray-800 transition-all text-sm font-medium text-black dark:text-white placeholder-gray-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button onClick={handleSubmit} className="absolute right-1 top-1 bottom-1 bg-[#5FC36C] text-white px-6 rounded-lg hover:bg-[#4CAF50] transition-colors flex items-center justify-center">
              <span className="font-bold text-sm">Найти</span>
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (onSearchChange) onSearchChange(suggestion);
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F4F9F4] dark:hover:bg-gray-700 hover:text-[#1A1A1A] dark:hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          
          <NotificationBell />

          <div 
            className="relative" 
            ref={profileRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button className={iconWrapper}>
              <User className={iconStyle} strokeWidth={2} />
              <span className={labelStyle}>
                {formatName(clientName)}
                <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {isProfileMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 py-2"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Link href="/shop/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-[#F4F9F4] dark:hover:bg-gray-700 transition-colors">
                  <User className="w-4 h-4 text-gray-400" /> Мой профиль
                </Link>
                <Link href="/shop/orders" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-[#F4F9F4] dark:hover:bg-gray-700 transition-colors">
                  <Package className="w-4 h-4 text-gray-400" /> Мои заказы
                </Link>
                <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                {/* ОСТАВЛЕН ТОЛЬКО ОДИН ПУНКТ, ВЕДЕТ НА ЯКОРЬ */}
                <Link href="/shop/settings#requisites" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-[#F4F9F4] dark:hover:bg-gray-700 transition-colors">
                  <Building2 className="w-4 h-4 text-gray-400" /> Моя организация
                </Link>
              </div>
            )}
          </div>

          <Link href={supportLink} className={iconWrapper}>
            <MessageSquare className={iconStyle} strokeWidth={2} />
            <span className={labelStyle}>Помощь</span>
          </Link>

          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

          <Link href="/shop/favorites" className={iconWrapper + " relative"}>
            <div className="relative flex items-center justify-center">
              <Heart className={iconStyle} strokeWidth={2} />
              {favoritesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF8A8A] text-white text-[9px] font-black min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full border border-white">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </div>
            <span className={labelStyle}>Избранное</span>
          </Link>

          <Link href="/shop/cart" className={iconWrapper + " relative"}>
            <div className="relative flex items-center justify-center">
              <ShoppingCart className={iconStyle} strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#5FC36C] text-white text-[9px] font-black min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full border border-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className={labelStyle}>Корзина</span>
          </Link>

        </div>
      </div>
    </header>
  );
}