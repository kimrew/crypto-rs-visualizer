import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const interval = searchParams.get('interval') || '1h';

  // 1. 기간 설정 (미너비니 스타일은 기간별 가중치가 중요하지만, 우선 선택된 기간 대비로 계산)
  const intervalMap: Record<string, string> = {
    '1h': '1 hour',
    '4h': '4 hours',
    '1d': '24 hours',
    '1w': '7 days',
    '1m': '30 days'
  };
  const timeRange = intervalMap[interval] || '1 hour';

  try {
    /**
     * 2. SQL 쿼리 전략:
     * - 각 코인의 현재가와 설정 기간 전의 가격을 가져와 수익률(return) 계산
     * - TOTAL_MARKET(트레이딩뷰 지수)의 수익률을 기준점(Benchmark)으로 사용
     * - RS Score = 코인 수익률 - 지수 수익률
     * - RS Rating = RS Score를 0~99점 백분위로 환산
     */
    const { rows } = await sql`
      WITH raw_data AS (
        SELECT 
          symbol,
          price,
          FIRST_VALUE(price) OVER (PARTITION BY symbol ORDER BY timestamp ASC) as start_price,
          ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY timestamp DESC) as rn
        FROM market_data
        WHERE timestamp >= NOW() - CAST(${timeRange} AS INTERVAL)
      ),
      latest_prices AS (
        SELECT symbol, price as current_price, start_price
        FROM raw_data
        WHERE rn = 1
      ),
      returns AS (
        SELECT 
          symbol,
          current_price,
          ((current_price / start_price) - 1) * 100 as change_p
        FROM latest_prices
        WHERE start_price > 0
      ),
      benchmark AS (
        -- 트레이딩뷰에서 보낸 TOTAL 지수 수익률 추출 (없으면 0으로 처리)
        SELECT COALESCE(change_p, 0) as b_return
        FROM returns 
        WHERE symbol = 'TOTAL_MARKET'
        UNION ALL
        SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM returns WHERE symbol = 'TOTAL_MARKET')
        LIMIT 1
      ),
      rs_calculated AS (
        SELECT 
          r.symbol,
          r.change_p,
          r.current_price,
          (r.change_p - (SELECT b_return FROM benchmark)) as rs_score
        FROM returns r
        WHERE r.symbol != 'TOTAL_MARKET' -- 지수는 리스트에서 제외
      )
      SELECT 
        symbol,
        current_price,
        change_p,
        rs_score,
        -- 0~99점 사이의 미너비니 스타일 Rating 계산
        ROUND(CAST(PERCENT_RANK() OVER (ORDER BY rs_score) * 99 AS NUMERIC), 0) as rs_rating
      FROM rs_calculated
      ORDER BY rs_rating DESC;
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error('Market API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}