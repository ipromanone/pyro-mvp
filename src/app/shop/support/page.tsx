'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { MessageSquare, Send, Plus, CheckCircle2, Search, X, Bot, AlertCircle, Clock } from 'lucide-react';

export default function SupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('Клиент');
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'open' | 'closed'>('all');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      
      setUserId(session.user.id);
      
      const { data: org } = await supabase.from('organizations').select('name').eq('user_id', session.user.id).limit(1).single();
      if (org) setClientName(org.name);

      const { data: cartData } = await supabase.from('cart_items').select('quantity').eq('user_id', session.user.id);
      if (cartData) setCartCount(cartData.reduce((sum, item) => sum + item.quantity, 0));

      const { data: favData } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
      if (favData) setFavoritesCount(favData.length);

      const { data: sessionsData } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });
      
      if (sessionsData && isMounted) {
        setSessions(sessionsData);
      }

      if (isMounted) setLoading(false);
    }
    init();
    return () => { isMounted = false; };
  }, [router]);

  // Realtime подписка на сообщения
  useEffect(() => {
    if (!activeSession || !userId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();

    const channel = supabase
      .channel(`support_chat:${activeSession.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${activeSession.id}` },
        (payload) => {
          // ИСПРАВЛЕНИЕ: Проверяем, нет ли уже такого сообщения
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });

          if (payload.new.sender_type === 'admin' && payload.new.sender_name !== 'Система' && payload.new.sender_name !== 'Умный помощник') {
            setToast({ message: 'Новое сообщение от менеджера!', type: 'info' });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeSession, userId]);

  // Realtime подписка на статус сессий (чтобы закрывалось в реальном времени)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`support_sessions:${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_sessions', filter: `user_id=eq.${userId}` },
        () => {
          supabase.from('chat_sessions').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
            .then(({ data }) => { if (data) setSessions(data); });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !userId) return;

    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert({ 
        user_id: userId, 
        client_name: clientName, 
        status: 'open',
        topic: newTopic 
      })
      .select()
      .single();

    if (error || !newSession) {
      setToast({ message: 'Ошибка: ' + error?.message, type: 'error' });
      return;
    }

    await supabase.from('chat_messages').insert({
      session_id: newSession.id,
      sender_type: 'admin',
      sender_name: 'Система',
      message: `Поступило обращение от ${clientName}. Тема: ${newTopic}`,
    });

    await supabase.from('chat_messages').insert({
      session_id: newSession.id,
      sender_type: 'admin',
      sender_name: 'Умный помощник',
      message: "Здравствуйте! Мы получили ваше обращение. В ближайшее время с вами свяжется свободный менеджер.",
    });

    setSessions([newSession, ...sessions]);
    setActiveSession(newSession);
    setNewTopic('');
    setIsCreating(false);
    setToast({ message: 'Обращение создано', type: 'success' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession || !userId) return;

    const text = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('chat_messages').insert({
      session_id: activeSession.id,
      sender_type: 'client',
      sender_name: clientName,
      message: text,
    });

    if (error) {
      setToast({ message: 'Ошибка отправки: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Сообщение отправлено', type: 'success' });
    }
  };
  
  const handleCloseSession = async () => {
    if (!activeSession) return;
    await supabase.from('chat_sessions').update({ status: 'closed' }).eq('id', activeSession.id);
    setActiveSession({...activeSession, status: 'closed'});
    setSessions(prev => prev.map(s => s.id === activeSession.id ? {...s, status: 'closed'} : s));
    setShowCloseConfirm(false);
    setToast({ message: 'Обращение закрыто', type: 'success' });
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB]"></div>;

  const filteredSessions = sessions.filter(s => {
    const matchStr = `${s.topic || ''} ${s.id}`.toLowerCase();
    const matchesSearch = matchStr.includes(searchQuery.toLowerCase());
    
    if (filterTab === 'all') return matchesSearch;
    if (filterTab === 'open') return matchesSearch && s.status === 'open';
    if (filterTab === 'closed') return matchesSearch && s.status === 'closed';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1A1A1A] font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ConfirmModal 
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseSession}
        title="Закрыть обращение?"
        message="Вы уверены, что хотите закрыть это обращение? Вы больше не сможете отправлять по нему сообщения."
        confirmText="Закрыть"
        isDanger={true}
      />
      
      <ShopHeader cartCount={cartCount} favoritesCount={favoritesCount} clientName={clientName} />

      <main className="flex-grow max-w-[1400px] mx-auto px-6 mt-8 pb-20 w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">Поддержка</h1>
            <p className="text-gray-500 font-medium text-lg">Задайте вопрос по заказу, счету или доставке.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#5FC36C] text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#4CAF50] transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
          >
            <Plus className="w-6 h-6" /> Новое обращение
          </button>
        </div>

        {isCreating && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setIsCreating(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black mb-2">Новое обращение</h2>
              <p className="text-gray-500 font-medium mb-6">Опишите вашу проблему.</p>
              
              <form onSubmit={handleCreateTicket}>
                <textarea
                  autoFocus
                  rows={4}
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Например: Не могу скачать счет на оплату..."
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-4 font-medium text-base focus:outline-none focus:border-[#5FC36C] transition-colors resize-none mb-6"
                />
                <button type="submit" className="w-full bg-[#5FC36C] text-white py-4 rounded-xl font-black text-lg hover:bg-[#4CAF50]">
                  Отправить обращение
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex h-[700px]">
          
          <div className="w-[400px] border-r border-gray-200 flex flex-col bg-white">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-black text-2xl">Мои обращения</h2>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Поиск по теме или номеру"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#5FC36C]"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setFilterTab('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filterTab === 'all' ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>Все</button>
                <button onClick={() => setFilterTab('open')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filterTab === 'open' ? 'bg-[#E3F2E3] text-[#5FC36C]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>Открытые</button>
                <button onClick={() => setFilterTab('closed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filterTab === 'closed' ? 'bg-gray-200 text-gray-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>Закрытые</button>
              </div>
            </div>

            <div className="overflow-y-auto flex-grow">
              {filteredSessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSession(s); setIsCreating(false); }}
                  className={`w-full text-left p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors relative ${
                    activeSession?.id === s.id && !isCreating ? 'bg-[#F4F9F4]' : ''
                  }`}
                >
                  {activeSession?.id === s.id && !isCreating && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5FC36C]"></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-base text-gray-900 line-clamp-1 pr-3">
                      {s.topic || `Обращение #${s.id.slice(0, 4)}`}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mt-1">
                      {new Date(s.updated_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {s.status === 'open' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5FC36C] bg-[#E3F2E3] px-2 py-0.5 rounded">
                        Активно
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Закрыто
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(s.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))}
              {filteredSessions.length === 0 && (
                <div className="p-8 text-center text-gray-400 mt-10">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Ничего не найдено</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-grow flex flex-col bg-white">
            {activeSession ? (
              <>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-black text-xl">{activeSession.topic || `Обращение #${activeSession.id.slice(0, 6)}`}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      {activeSession.status === 'open' ? (
                        <><span className="w-2 h-2 rounded-full bg-[#5FC36C]"></span> В работе</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> Закрыто</>
                      )}
                    </p>
                  </div>
                  {activeSession.status === 'open' && (
                    <button 
                      onClick={() => setShowCloseConfirm(true)}
                      className="text-sm font-bold text-gray-500 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                    >
                      Закрыть обращение
                    </button>
                  )}
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-[#F9FAFB]">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'client' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[70%] p-5 rounded-2xl text-base ${
                        msg.sender_type === 'client'
                          ? 'bg-[#5FC36C] text-white rounded-br-sm shadow-md shadow-green-500/10'
                          : msg.sender_name === 'Система'
                          ? 'bg-gray-200 text-gray-700 border border-gray-300 rounded-bl-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.sender_type === 'admin' && msg.sender_name !== 'Система' && (
                          <div className="flex items-center gap-1.5 mb-1">
                            {msg.sender_name === 'Умный помощник' && <Bot className="w-4 h-4 text-[#5FC36C]" />}
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${msg.sender_name === 'Умный помощник' ? 'text-[#5FC36C]' : 'text-gray-500'}`}>
                              {msg.sender_name === 'Умный помощник' ? 'Умный помощник' : 'Менеджер'}
                            </p>
                          </div>
                        )}
                        {msg.sender_name === 'Система' && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                              Система
                            </p>
                          </div>
                        )}
                        {msg.message}
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 mt-2 px-1">
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {activeSession.status === 'open' ? (
                  <form onSubmit={sendMessage} className="p-6 bg-white border-t border-gray-100 flex gap-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Напишите сообщение..."
                      className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-base font-medium focus:outline-none focus:border-[#5FC36C]"
                    />
                    <button type="submit" className="bg-[#5FC36C] text-white px-8 rounded-2xl hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center">
                      <Send className="w-6 h-6" />
                    </button>
                  </form>
                ) : (
                  <div className="p-6 bg-gray-50 border-t border-gray-100 text-center text-sm font-bold text-gray-500">
                    Это обращение закрыто. Создайте новое, если у вас остались вопросы.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
                <div className="w-24 h-24 mb-6 rounded-[2rem] bg-[#5FC36C]/10 flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-[#5FC36C]" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Выберите обращение</h3>
                <p className="text-base font-medium text-gray-500 max-w-xs mx-auto">Выберите обращение из списка слева или создайте новое.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}