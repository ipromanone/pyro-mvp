'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Settings, Eye } from 'lucide-react';
import { supabase } from '../app/supabase';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'read'>('new');
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (data) setNotifications(data);
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const currentList = activeTab === 'new' ? notifications.filter(n => !n.is_read) : notifications.filter(n => n.is_read);

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex flex-col items-center gap-1 group relative py-1 cursor-pointer">
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-400 group-hover:text-[#5FC36C] transition-colors" strokeWidth={2.5} />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF8A8A] border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </div>
        <span className="text-xs font-bold text-gray-600 group-hover:text-[#5FC36C] transition-colors whitespace-nowrap flex items-center gap-1">
          Уведомления
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full pt-2 w-80 z-[100]">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[500px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-black text-lg">Уведомления</h3>
              <div className="flex gap-2">
                <button onClick={markAllAsRead} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-[#5FC36C]" title="Прочитать все"><Check className="w-5 h-5" /></button>
                
                {/* ИСПРАВЛЕННАЯ ССЫЛКА НА НАСТРОЙКИ */}
                <button onClick={() => router.push('/shop/settings?tab=notifications')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-black" title="Настройки уведомлений">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex px-4 border-b border-gray-100">
              <button onClick={() => setActiveTab('new')} className={`pb-3 pt-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'new' ? 'border-[#5FC36C] text-[#5FC36C]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Новые {unreadCount > 0 && `(${unreadCount})`}</button>
              <button onClick={() => setActiveTab('read')} className={`pb-3 pt-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'read' ? 'border-[#5FC36C] text-[#5FC36C]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Прочитанные</button>
            </div>
            
            <div className="overflow-y-auto flex-grow p-2">
              {currentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Eye className="w-10 h-10 text-gray-300 mb-3" strokeWidth={1.5} />
                  <p className="font-bold text-sm text-gray-700 mb-1">{activeTab === 'new' ? 'Новых уведомлений пока нет' : 'Прочитанных уведомлений нет'}</p>
                  <p className="text-xs text-gray-400">{activeTab === 'new' ? 'Архивные можно посмотреть во вкладке «Прочитанные»' : 'Здесь будет история ваших уведомлений'}</p>
                </div>
              ) : (
                currentList.map(notif => (
                  <div key={notif.id} onClick={() => { if (!notif.is_read) { supabase.from('notifications').update({ is_read: true }).eq('id', notif.id); setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)); } setIsOpen(false); }} className={`p-3 rounded-xl cursor-pointer transition-colors mb-1 ${notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-[#E3F2E3]/50 hover:bg-[#E3F2E3]'}`}>
                    <p className="font-bold text-sm text-gray-900 mb-1">{notif.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}