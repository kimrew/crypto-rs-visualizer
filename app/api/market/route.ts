import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 중복 제거를 위해 DISTINCT와 MAX(id) 등을 조합한 최적화 쿼리
    const { rows } = await sql`
      WITH filtered_data AS (
        SELECT symbol, price, change_p, timestamp,
               ROW_NUMBER() OVER (PARTITION BY symbol, timestamp ORDER BY id DESC) as rn
        FROM market_data
      )
      SELECT symbol, change_p, timestamp 
      FROM filtered_data 
      WHERE rn = 1 -- 중복된 시간 데이터 중 가장 마지막 것만 선택
      AND timestamp >= NOW() - INTERVAL '48 hours'
      ORDER BY symbol ASC, timestamp ASC;
    `;

    const symbolMap: Record<string, any> = {};

    rows.forEach((row) => {
      const { symbol, change_p, timestamp } = row;
      if (!symbolMap[symbol]) {
        symbolMap[symbol] = { symbol, history: [] };
      }

      const date = new Date(timestamp);
      // 시간 표시를 더 명확하게 (예: "16일 02시")
      const timeLabel = `${date.getHours()}:00`;

      symbolMap[symbol].history.push({
        time: timeLabel,
        change: parseFloat(change_p)
      });
    });

    return NextResponse.json({ matrix: Object.values(symbolMap) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}