import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. OKX API에서 실시간 데이터 가져오기 (테스트용으로 BTC 하나만)
    const okxRes = await fetch('https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT', {
      cache: 'no-store'
    });
    const okxJson = await okxRes.json();
    const btcData = okxJson.data[0];

    if (!btcData) throw new Error("OKX Data not found");

    const symbol = 'BTC';
    const price = parseFloat(btcData.last);
    const open24h = parseFloat(btcData.open24h);
    const change_p = ((price - open24h) / open24h) * 100;

    // 2. Vercel Postgres DB에 저장 시도
    const result = await sql`
      INSERT INTO market_data (symbol, price, change_p, timestamp)
      VALUES (${symbol}, ${price}, ${change_p}, NOW())
      RETURNING *;
    `;

    return NextResponse.json({ 
      message: "Success! Data saved to DB.",
      inserted: result.rows[0] 
    });

  } catch (error: any) {
    console.error("DB Insert Error:", error);
    return NextResponse.json({ 
      message: "Failed to save data", 
      error: error.message 
    }, { status: 500 });
  }
}