import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // 지원 단위: 1H, 4H, 1D, 1W, 1M
  const bar = searchParams.get('bar') || '1H'; 

  try {
    const tickerRes = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const tickerJson = await tickerRes.json();
    
    // 시총/거래대금 상위 30개 코인 (개수는 필요에 따라 조절 가능)
    const topSymbols = tickerJson.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .sort((a: any, b: any) => parseFloat(b.vol24h) - parseFloat(a.vol24h))
      .slice(0, 30);

    const matrix = await Promise.all(topSymbols.map(async (s: any) => {
      // 바뀐 단위(bar)를 그대로 API에 전달 (1W, 1M은 OKX 공식 지원 규격임)
      const candleRes = await fetch(
        `https://www.okx.com/api/v5/market/candles?instId=${s.instId}&bar=${bar}&limit=30`
      );
      const candleJson = await candleRes.json();
      
      if (!candleJson.data) return null;

      const history = candleJson.data.reverse().map((c: any) => {
        const timestamp = parseInt(c[0]);
        const open = parseFloat(c[1]);
        const close = parseFloat(c[4]);
        const change = ((close - open) / open) * 100;
        
        // 날짜 표시 형식 최적화 (단위에 따라 날짜/시간 다르게 표시)
        const dateObj = new Date(timestamp);
        const timeStr = (bar === '1W' || bar === '1M' || bar === '1D') 
          ? `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
          : `${dateObj.getHours()}:00`;

        return { time: timeStr, change };
      });

      return { symbol: s.instId.split('-')[0], history };
    }));

    return NextResponse.json({ matrix: matrix.filter(m => m !== null) });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}