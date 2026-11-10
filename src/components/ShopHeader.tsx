'use client';

import Link from 'next/link';
import { User, Package, Heart, ShoppingCart, Search, ChevronDown, Settings } from 'lucide-react';
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
  onSuggestionSelect
}: { 
  cartCount: number, 
  favoritesCount: number, 
  clientName: string,
  searchTerm?: string,
  onSearchChange?: (val: string) => void,
  onSearchSubmit?: (val: string) => void,
  onSuggestionSelect?: (val: string) => void
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Функция для красивого сокращения имени: "ИП Песня Роман Владимирович" -> "ИП Песня Р.В."
  const formatName = (name: string) => {
    if (!name) return 'Профиль';
    if (!name.startsWith('ИП') && !name.startsWith('ООО') && name.length <= 18) return name;
    
    const parts = name.split(' ');
    if (parts.length < 3) return name;

    const orgType = parts[0]; // ИП или ООО
    const lastName = parts[1]; // Фамилия
    const firstName = parts[2]; // Имя
    const middleName = parts[3]; // Отчество (если есть)

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

  // ЕДИНЫЙ СТИЛЬ ДЛЯ ВСЕХ ИКОНОК
  const iconContainerClass = "flex flex-col items-center gap-1 group relative py-1 cursor-pointer";
  const iconLabelClass = "text-xs font-bold text-gray-600 group-hover:text-[#5FC36C] transition-colors whitespace-nowrap flex items-center gap-1";

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-8">
        
        <Link href="/shop" className="text-4xl font-black text-black tracking-tighter shrink-0">
          Pyro<span className="text-[#5FC36C]">.</span>
        </Link>

        <div className="flex-grow max-w-2xl relative">
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
              className="w-full bg-[#F3F4F6] border-2 border-transparent rounded-xl py-3 pl-12 pr-14 focus:outline-none focus:border-[#5FC36C] focus:bg-white transition-all text-base font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button onClick={handleSubmit} className="absolute right-1 top-1 bottom-1 bg-[#5FC36C] text-white px-5 rounded-lg hover:bg-[#4CAF50] transition-colors flex items-center justify-center">
              <span className="font-bold text-sm">Найти</span>
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (onSuggestionSelect) onSuggestionSelect(suggestion);
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-5 py-3 text-sm font-medium text-gray-700 hover:bg-[#F4F9F4] hover:text-[#1A1A1A] transition-colors flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ИКОНКИ */}
        <div className="flex items-center gap-4 xl:gap-6 shrink-0">
          
          {/* Профиль (с наведением) */}
          <div 
            className="relative" 
            ref={profileRef}
            onMouseEnter={() => setIsProfileMenuOpen(true)}
            onMouseLeave={() => setIsProfileMenuOpen(false)}
          >
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={iconContainerClass}
            >
              <User className="w-6 h-6 text-gray-400 group-hover:text-[#5FC36C] transition-colors" strokeWidth={2.5} />
              <span className={iconLabelClass}>
                {formatName(clientName)}
                <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full pt-2 w-64 z-50">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-2">
                  <Link href="/shop/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#F4F9F4] transition-colors">
                    <User className="w-4 h-4 text-gray-400" /> Профиль
                  </Link>
                  <Link href="/shop/orders" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#F4F9F4] transition-colors">
                    <Package className="w-4 h-4 text-gray-400" /> Заказы
                  </Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <Link href="/shop/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#F4F9F4] transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" /> Настройки
                  </Link>
                </div>
              </div>
            )}
          </div>

          <NotificationBell />

          <Link href="/shop/favorites" className={iconContainerClass + " relative"}>
            <Heart className="w-6 h-6 text-gray-400 group-hover:text-[#5FC36C] transition-colors" strokeWidth={2.5} />
            {favoritesCount > 0 && (
              <span className="absolute top-0 right-2 bg-[#FF8A8A] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {favoritesCount}
              </span>
            )}
            <span className={iconLabelClass}>Избранное</span>
          </Link>

          <Link href="/shop/cart" className={iconContainerClass + " relative"}>
            <ShoppingCart className="w-6 h-6 text-gray-400 group-hover:text-[#5FC36C] transition-colors" strokeWidth={2.5} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-2 bg-[#5FC36C] text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
            <span className={iconLabelClass}>Корзина</span>
          </Link>

        </div>
      </div>
    </header>
  );
}