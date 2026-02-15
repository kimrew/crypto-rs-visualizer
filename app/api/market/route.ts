import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // 시간 단위: 1H(1시간), 4H(4시간), 1D(1일)
  const bar = searchParams.get('bar') || '1H'; 

  try {
    // 1. 거래대금 상위 코인을 식별하기 위해 티커 호출
    const tickerRes = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const tickerJson = await tickerRes.json();
    
    // 거래대금 상위 50개 선정 (API 부하 방지 및 신뢰성 확보)
    const topSymbols = tickerJson.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .sort((a: any, b: any) => parseFloat(b.vol24h) - parseFloat(a.vol24h))
      .slice(0, 50);

    // 2. 각 코인별 선택된 시간 단위의 캔들 데이터 가져오기
    const results = await Promise.all(topSymbols.map(async (s: any) => {
      const candleRes = await fetch(
        `https://www.okx.com/api/v5/market/candles?instId=${s.instId}&bar=${bar}&limit=2`
      );
      const candleJson = await candleRes.json();
      
      if (candleJson.data && candleJson.data.length >= 1) {
        const current = parseFloat(candleJson.data[0][4]); // 종가(현재가)
        const open = parseFloat(candleJson.data[0][1]);    // 시가
        const change = ((current - open) / open) * 100;    // 기간 수익률
        return {
          symbol: s.instId.split('-')[0],
          change,
          price: current
        };
      }
      return null;
    }));

    const validData = results.filter(r => r !== null);
    const avgChange = validData.reduce((a, b) => a + b!.change, 0) / validData.length;

    return NextResponse.json({
      tickers: validData,
      avgChange,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false })
    });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}