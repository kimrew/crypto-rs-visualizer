import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    /**
     * 1. DB에서 데이터 조회
     * - 최근 24개(24시간)의 타임스탬프를 먼저 찾고, 해당 시점의 모든 코인 데이터를 가져옵니다.
     * - 'NOW() - INTERVAL' 대신 'DISTINCT timestamp'를 쓰는 이유는 
     * 수집이 잠깐 멈췄더라도 차트의 가로축 칸이 비지 않게 하기 위함입니다.
     */
    const { rows } = await sql`
      WITH latest_times AS (
        SELECT DISTINCT timestamp 
        FROM market_data 
        ORDER BY timestamp DESC 
        LIMIT 24 -- 최근 24시간치 노출 (원하는 시간만큼 조절 가능)
      )
      SELECT symbol, change_p, timestamp 
      FROM market_data 
      WHERE timestamp IN (SELECT timestamp FROM latest_times)
      ORDER BY symbol ASC, timestamp ASC;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ matrix: [] });
    }

    /**
     * 2. 데이터를 심볼별로 그루핑 (Matrix 구조 변환)
     * 결과 예시: [{ symbol: 'BTC', history: [{ time: '14:00', change: 1.5 }, ...] }, ...]
     */
    const symbolMap: Record<string, any> = {};

    rows.forEach((row) => {
      const { symbol, change_p, timestamp } = row;
      
      if (!symbolMap[symbol]) {
        symbolMap[symbol] = {
          symbol: symbol,
          history: []
        };
      }

      // 시간 포맷 (14:00, 15:00 등)
      const date = new Date(timestamp);
      const timeLabel = `${date.getHours()}:00`;

      symbolMap[symbol].history.push({
        time: timeLabel,
        change: parseFloat(change_p)
      });
    });

    // 객체를 배열로 변환하여 반환
    const matrix = Object.values(symbolMap);

    return NextResponse.json({ matrix });
  } catch (error: any) {
    console.error("Market API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}