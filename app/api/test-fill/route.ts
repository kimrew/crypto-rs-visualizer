import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. 거래대금 상위 코인 50개 리스트 가져오기
    const tickerRes = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const tickerJson = await tickerRes.json();
    const topSymbols = tickerJson.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .sort((a: any, b: any) => parseFloat(b.vol24h) - parseFloat(a.vol24h))
      .slice(0, 50);

    let totalInserted = 0;

    // 2. 각 코인별로 과거 24시간치 캔들 데이터 가져오기 (1시간봉)
    for (const t of topSymbols) {
      const instId = t.instId;
      const symbol = instId.split('-')[0];
      
      // 1H 봉 데이터 조회
      const candleRes = await fetch(`https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=1H&limit=24`);
      const candleJson = await candleRes.json();
      const candles = candleJson.data; // [ts, open, high, low, close, ...]

      for (const candle of candles) {
        const timestamp = new Date(parseInt(candle[0])).toISOString();
        const price = parseFloat(candle[4]); // close price
        const open = parseFloat(candle[1]);  // open price
        const change_p = ((price - open) / open) * 100;

        await sql`
          INSERT INTO market_data (symbol, price, change_p, timestamp)
          VALUES (${symbol}, ${price}, ${change_p}, ${timestamp})
          ON CONFLICT DO NOTHING;
        `;
        totalInserted++;
      }
      // API 과부하 방지를 위한 아주 짧은 대기 (선택)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return NextResponse.json({ message: "Done!", totalInserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}