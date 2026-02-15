import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const interval = searchParams.get('interval') || '1h';

  // 기간 설정
  const intervalMap: Record<string, string> = {
    '1h': '1 hour',
    '4h': '4 hours',
    '1d': '1 day',
    '1w': '7 days'
  };
  const timeRange = intervalMap[interval] || '1 hour';

  try {
    /**
     * 1. 최신 가격(Current)과 N시간 전 가격(Base)을 정밀하게 추출
     * 2. 데이터가 부족하여 Base 가격이 없으면 리스트에서 제외 (0점 방지)
     * 3. TOTAL_MARKET 지수를 기준으로 상대 수익률 계산
     */
    const { rows } = await sql`
      WITH latest_prices AS (
        -- 각 코인별 가장 최근 가격
        SELECT DISTINCT ON (symbol) 
          symbol, 
          price as current_price,
          timestamp as current_ts
        FROM market_data
        ORDER BY symbol, timestamp DESC
      ),
      base_prices AS (
        -- 각 코인별 설정 기간(예: 1시간 전)에 가장 가까운 과거 가격
        SELECT DISTINCT ON (symbol) 
          symbol, 
          price as base_price,
          timestamp as base_ts
        FROM market_data
        WHERE timestamp <= NOW() - CAST(${timeRange} AS INTERVAL)
        ORDER BY symbol, timestamp DESC
      ),
      calculated_returns AS (
        SELECT 
          l.symbol,
          l.current_price,
          b.base_price,
          ((l.current_price / b.base_price) - 1) * 100 as change_p
        FROM latest_prices l
        INNER JOIN base_prices b ON l.symbol = b.symbol
        WHERE b.base_price > 0
      ),
      benchmark AS (
        -- TOTAL_MARKET 지수의 수익률을 기준점으로 설정
        SELECT COALESCE((SELECT change_p FROM calculated_returns WHERE symbol = 'TOTAL_MARKET'), 0) as b_return
      ),
      rs_table AS (
        SELECT 
          r.symbol,
          r.current_price,
          r.change_p,
          (r.change_p - (SELECT b_return FROM benchmark)) as rs_score
        FROM calculated_returns r
        WHERE r.symbol != 'TOTAL_MARKET'
      )
      SELECT 
        symbol,
        current_price,
        change_p,
        rs_score,
        ROUND(CAST(PERCENT_RANK() OVER (ORDER BY rs_score) * 99 AS NUMERIC), 0) as rs_rating
      FROM rs_table
      ORDER BY rs_rating DESC;
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error('Market API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}