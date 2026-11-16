import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🔍 Запрос к DaData (банк) с BIK:', body.query);

    const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Token 70f1eefc26057ffd266c229b45ff927301d5d6ff',
      },
      body: JSON.stringify({ query: body.query }),
    });

    const data = await response.json();
    console.log('📦 Ответ от DaData (банк):', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Ошибка в API (банк):', error);
    return NextResponse.json({ error: 'Ошибка запроса к DaData' }, { status: 500 });
  }
}