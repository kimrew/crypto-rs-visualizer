import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // OKX 모든 티커 데이터 (SPOT 기준)
    const res = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT', {
      next: { revalidate: 0 }
    });

    const json = await res.json();
    if (json.code !== '0') throw new Error('OKX API Error');

    // USDT 페어만 필터링하고 데이터 정제
    const tickers = json.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .map((t: any) => ({
        symbol: t.instId.split('-')[0],
        price: parseFloat(t.last),
        vol: parseFloat(t.vol24h), // 24시간 거래량
        change: parseFloat(t.last) / parseFloat(t.open24h) - 1 // 변화율
      }));

    // 전체 시장 강도 계산 (평균 변화율)
    const avgChange = tickers.reduce((a: any, b: any) => a + b.change, 0) / tickers.length;

    return NextResponse.json({
      tickers,
      avgChange,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false })
    });
  } catch (error) {
    return NextResponse.json({ error: "OKX Fetch Failed" }, { status: 500 });
  }
}