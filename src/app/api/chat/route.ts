import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Используем ключ, который выдаёт TatNet (sb_publishable_...)
// На сервере он должен работать, так как запрос идёт не из браузера
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    // 1. Получить все сессии (для админки)
    if (action === 'get_sessions') {
      let query = supabase.from('chat_sessions').select('*').order('updated_at', { ascending: false });
      if (payload?.userId) query = query.eq('user_id', payload.userId);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ data });
    }

    // 2. Получить сообщения для конкретной сессии
    if (action === 'get_messages') {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', payload.sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ data });
    }

    // 3. Отправить сообщение
    if (action === 'send_message') {
      const { error } = await supabase.from('chat_messages').insert({
        session_id: payload.sessionId,
        sender_type: payload.senderType,
        sender_name: payload.senderName,
        message: payload.message,
      });
      if (error) throw error;
      await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', payload.sessionId);
      return NextResponse.json({ success: true });
    }

    // 4. Создать новую сессию (клиент)
    if (action === 'create_session') {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: payload.userId, client_name: payload.clientName, status: 'open' })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}