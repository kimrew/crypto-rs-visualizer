import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Vercel 환경에서 실행 시간 제한을 늘리고 캐시를 방지합니다.
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 전체 코인 처리 시 시간이 걸릴 수 있으므로 60초로 설정 (Hobby 플랜 최대치)

export async function GET(request: Request) {
  // 보안을 위해 Vercel Cron 헤더 확인 (선택 사항이지만 권장)
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    // 1. OKX API에서 모든 현물(SPOT) 티커 가져오기
    const res = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT', {
      cache: 'no-store'
    });
    const { data } = await res.json();

    if (!data) throw new Error("Failed to fetch data from OKX");

    // 2. USDT 마켓만 필터링
    const allSymbols = data.filter((t: any) => t.instId.endsWith('-USDT'));

    // 3. 저장 시각을 현재 시간의 '정각'으로 고정 (예: 14:35 -> 14:00)
    // 이렇게 해야 나중에 차트에서 가로축 시간이 예쁘게 정렬됩니다.
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const fixedTimestamp = now.toISOString();

    console.log(`Starting collection for ${allSymbols.length} symbols at ${fixedTimestamp}`);

    /**
     * 4. 데이터 저장 로직
     * 전체 코인을 한 번에 다 넣으면 DB 부하가 생길 수 있으므로 루프를 활용합니다.
     * OKX의 change_p는 '오늘 00시' 기준이므로, 이 데이터가 DB에 시간별로 쌓이면 
     * 나중에 '직전 1시간 대비 변화량'도 계산할 수 있게 됩니다.
     */
    for (const t of allSymbols) {
      const symbol = t.instId.split('-')[0];
      const price = parseFloat(t.last);
      const open24h = parseFloat(t.open24h);
      const change_p = open24h === 0 ? 0 : ((price - open24h) / open24h) * 100;

      // INSERT 실행
      await sql`
        INSERT INTO market_data (symbol, price, change_p, timestamp)
        VALUES (${symbol}, ${price}, ${change_p}, ${fixedTimestamp})
        ON CONFLICT (id) DO NOTHING; 
      `;
    }

    return NextResponse.json({
      success: true,
      count: allSymbols.length,
      collectedAt: fixedTimestamp
    });

  } catch (error: any) {
    console.error("Collection Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}