import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Vercel Cron이 이 경로를 호출할 때 캐시를 무시하도록 설정
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. OKX API에서 상위 거래대금 코인 리스트 가져오기
    const tickerRes = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT', {
      cache: 'no-store'
    });
    const tickerJson = await tickerRes.json();
    
    // 거래대금(vol24h) 기준 상위 30개 추출
    const topSymbols = tickerJson.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .sort((a: any, b: any) => parseFloat(b.vol24h) - parseFloat(a.vol24h))
      .slice(0, 30);

    // 2. DB에 대량 삽입 (Batch Insert)
    // 참고: Vercel Postgres에서 한 번의 쿼리로 여러 행을 넣는 방식
    for (const t of topSymbols) {
      const symbol = t.instId.split('-')[0];
      const price = parseFloat(t.last);
      const open24h = parseFloat(t.open24h);
      const change_p = ((price - open24h) / open24h) * 100;

      await sql`
        INSERT INTO market_data (symbol, price, change_p)
        VALUES (${symbol}, ${price}, ${change_p});
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: `${topSymbols.length} assets collected at ${new Date().toISOString()}` 
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}