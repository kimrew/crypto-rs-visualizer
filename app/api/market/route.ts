import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bar = searchParams.get('bar') || '1H'; // 1H, 4H, 1D

  try {
    // 1. 시총/거래대금 상위 코인 리스트업
    const tickerRes = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const tickerJson = await tickerRes.json();
    
    const topSymbols = tickerJson.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .sort((a: any, b: any) => parseFloat(b.vol24h) - parseFloat(a.vol24h))
      .slice(0, 20); // 가독성을 위해 상위 20개 코인으로 제한

    // 2. 각 코인별 과거 30개 캔들 데이터 가져오기
    const matrix = await Promise.all(topSymbols.map(async (s: any) => {
      const candleRes = await fetch(
        `https://www.okx.com/api/v5/market/candles?instId=${s.instId}&bar=${bar}&limit=30`
      );
      const candleJson = await candleRes.json();
      
      // 캔들 데이터를 시간순(오래된 순)으로 정렬 후 변화율 계산
      const history = candleJson.data.reverse().map((c: any) => {
        const open = parseFloat(c[1]);
        const close = parseFloat(c[4]);
        const change = ((close - open) / open) * 100;
        return {
          time: new Date(parseInt(c[0])).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          change
        };
      });

      return {
        symbol: s.instId.split('-')[0],
        history
      };
    }));

    return NextResponse.json({ matrix });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}