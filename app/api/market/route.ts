import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // bar 파라미터에 따라 조회 기간을 결정 (기본 1H 로직)
  const bar = searchParams.get('bar') || '1H';

  try {
    /**
     * 1. DB에서 최신 데이터 가져오기
     * - 최근 30개의 타임스탬프(수집 시점)에 해당하는 데이터를 가져옵니다.
     * - 5분마다 수집한다고 가정할 때, 약 150분치 데이터를 가져오게 됩니다.
     */
    const { rows } = await sql`
      SELECT symbol, change_p, timestamp 
      FROM market_data 
      WHERE timestamp IN (
        SELECT DISTINCT timestamp 
        FROM market_data 
        ORDER BY timestamp DESC 
        LIMIT 30
      )
      ORDER BY timestamp ASC, symbol ASC;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ matrix: [], message: "No data in DB yet." });
    }

    /**
     * 2. 데이터를 프론트엔드용 Matrix 구조로 변환
     * 목표 구조: [{ symbol: 'BTC', history: [{ time: '12:00', change: 1.2 }, ...] }, ...]
     */
    const matrixMap: Record<string, any> = {};

    rows.forEach((row) => {
      if (!matrixMap[row.symbol]) {
        matrixMap[row.symbol] = {
          symbol: row.symbol,
          history: [],
        };
      }

      // 시간 표시 포맷 설정
      const dateObj = new Date(row.timestamp);
      const timeLabel = bar === '1D' || bar === '1W' || bar === '1M'
        ? `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
        : `${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

      matrixMap[row.symbol].history.push({
        time: timeLabel,
        change: parseFloat(row.change_p),
      });
    });

    // 객체를 배열로 변환
    const matrix = Object.values(matrixMap);

    return NextResponse.json({ matrix });
  } catch (error: any) {
    console.error("Database Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}