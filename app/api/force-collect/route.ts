import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

export async function GET() {
  try {
    const res = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT', {
      cache: 'no-store'
    });
    const { data } = await res.json();
    
    // USDT 마켓 전체 필터링 (약 500~700개)
    const allSymbols = data.filter((t: any) => t.instId.endsWith('-USDT'));

    const now = new Date();
    now.setMinutes(0, 0, 0); // 정각으로 고정
    const timestamp = now.toISOString();

    console.log(`Force collecting ${allSymbols.length} symbols...`);

    // 병렬 처리를 위해 Promise.all 대신 순차 처리가 DB 부하가 적습니다.
    for (const t of allSymbols) {
      const symbol = t.instId.split('-')[0];
      const price = parseFloat(t.last);
      const open24h = parseFloat(t.open24h);
      const change_p = open24h === 0 ? 0 : ((price - open24h) / open24h) * 100;

      await sql`
        INSERT INTO market_data (symbol, price, change_p, timestamp)
        VALUES (${symbol}, ${price}, ${change_p}, ${timestamp})
        ON CONFLICT (symbol, timestamp) DO UPDATE 
        SET price = EXCLUDED.price, change_p = EXCLUDED.change_p;
      `;
    }

    return NextResponse.json({ success: true, count: allSymbols.length, timestamp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}