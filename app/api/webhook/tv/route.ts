import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // 트레이딩뷰에서 보낼 형식: { "symbol": "TOTAL", "price": 2500000000000 }
    const { symbol, price } = data;

    if (symbol === 'TOTAL') {
      const now = new Date();
      now.setMinutes(0, 0, 0); // 정각 데이터로 저장
      
      await sql`
        INSERT INTO market_data (symbol, price, change_p, timestamp)
        VALUES ('TOTAL_MARKET', ${price}, 0, ${now.toISOString()})
        ON CONFLICT (symbol, timestamp) 
        DO UPDATE SET price = EXCLUDED.price;
      `;
    }

    return NextResponse.json({ message: "Webhook received" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}