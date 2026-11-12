'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../app/supabase';
import { MessageSquare, Send, User, CheckCircle2, Clock } from 'lucide-react';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

export default function AdminChatPanel({ onUnreadCountChange }: { onUnreadCountChange?: (count: number) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Подсчет непрочитанных сообщений
  const calculateUnread = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('sender_type', 'client')
      .eq('is_read', false);
      
    if (!error && data) {
      setUnreadCount(data.length);
      if (onUnreadCountChange) onUnreadCountChange(data.length);
    }
  };

  const loadSessions = async () => {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setSessions(data);
  };

  useEffect(() => {
    loadSessions();
    calculateUnread();

    // Подписка на изменения сессий
    const sessionsChannel = supabase
      .channel('admin_chat_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        loadSessions();
      })
      .subscribe();
      
    // Подписка на новые сообщения (чтобы обновлять счетчик)
    const messagesChannel = supabase
      .channel('admin_chat_messages_count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (payload.new.sender_type === 'client' && !payload.new.is_read) {
          calculateUnread();
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(sessionsChannel); 
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  useEffect(() => {
    if (!activeSession) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('created_at', { ascending: true });
      if (data) {
        setMessages(data);
        
        // Помечаем все сообщения клиента как прочитанные
        if (data.some(m => m.sender_type === 'client' && !m.is_read)) {
          await supabase.from('chat_messages')
            .update({ is_read: true })
            .eq('session_id', activeSession.id)
            .eq('sender_type', 'client')
            .eq('is_read', false);
            
          calculateUnread(); // Обновляем счетчик
        }
      }
    };
    loadMessages();

    const channel = supabase
      .channel(`admin_chat:${activeSession.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${activeSession.id}` },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          
          // Если пришло сообщение от клиента и мы в этом чате, сразу помечаем прочитанным
          if (payload.new.sender_type === 'client') {
            supabase.from('chat_messages').update({ is_read: true }).eq('id', payload.new.id).then(() => {
               calculateUnread();
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession) return;
    
    const text = newMessage;
    setNewMessage('');

    await supabase.from('chat_messages').insert({
      session_id: activeSession.id,
      sender_type: 'admin',
      sender_name: 'Менеджер',
      message: text,
    });
    
    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', activeSession.id);
    setToast({ message: 'Ответ отправлен', type: 'success' });
  };
  
  const handleCloseChat = async () => {
    if (!activeSession) return;
    await supabase.from('chat_sessions').update({ status: 'closed' }).eq('id', activeSession.id);
    setToast({ message: 'Диалог завершен', type: 'success' });
    loadSessions();
    setActiveSession(null);
    setShowCloseConfirm(false);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex h-[700px]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseChat}
        title="Завершить диалог?"
        message="Вы уверены, что хотите закрыть этот чат? Клиент больше не сможет отправлять сообщения."
        confirmText="Завершить"
        isDanger={true}
      />

      <div className="w-[380px] border-r border-gray-200 flex flex-col bg-white">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-black text-2xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#5FC36C]" /> Диалоги
          </h2>
        </div>
        <div className="overflow-y-auto flex-grow">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={`w-full text-left p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors relative ${
                activeSession?.id === s.id ? 'bg-[#F4F9F4]' : ''
              }`}
            >
              {activeSession?.id === s.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5FC36C]"></div>
              )}
              
              <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-base text-gray-900 line-clamp-1 pr-2">
                  {s.topic || `Обращение #${s.id.slice(0, 4)}`}
                </p>
                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mt-1">
                  {new Date(s.updated_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              
              <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {s.client_name}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s.status === 'open' ? 'Активен' : 'Закрыт'}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(s.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </button>
          ))}
          {sessions.length === 0 && <p className="p-8 text-center text-gray-400 text-sm font-medium">Нет диалогов</p>}
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-white">
        {activeSession ? (
          <>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
              <div>
                <h3 className="font-black text-xl">{activeSession.topic || `Обращение #${activeSession.id.slice(0, 8)}`}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <User className="w-4 h-4" /> {activeSession.client_name}
                </p>
              </div>
              {activeSession.status === 'open' && (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="text-sm font-bold bg-gray-100 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Завершить
                </button>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-[#F9FAFB]">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-5 rounded-2xl text-base ${
                    msg.sender_type === 'admin' 
                      ? 'bg-[#5FC36C] text-white rounded-br-sm shadow-md shadow-green-500/10' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.sender_type === 'client' && (
                      <p className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Клиент</p>
                    )}
                    {msg.message}
                    <p className={`text-[10px] mt-2 text-right ${msg.sender_type === 'admin' ? 'text-green-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendReply} className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Напишите ответ..."
                disabled={activeSession.status === 'closed'}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-base font-medium focus:outline-none focus:border-[#5FC36C] disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={activeSession.status === 'closed'}
                className="bg-[#5FC36C] text-white px-8 rounded-2xl font-bold hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20 disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
            <MessageSquare className="w-20 h-20 mb-6 opacity-20" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Выберите диалог</h3>
            <p className="text-base font-medium text-gray-500">Слева появится список клиентов, которые обратились в поддержку.</p>
          </div>
        )}
      </div>
    </div>
  );
}