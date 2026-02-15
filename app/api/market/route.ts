import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    
    // 캐시를 방지하기 위해 { cache: 'no-store' } 추가
    const requests = symbols.map(s => 
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`, { cache: 'no-store' })
        .then(res => res.json())
    );

    const results = await Promise.all(requests);
    
    // 데이터 추출 함수 (안전장치 추가)
    const getPrice = (obj: any) => {
      const p = parseFloat(obj?.price);
      return isNaN(p) ? "0.00" : p.toFixed(2);
    };

    const prices = {
      btc: getPrice(results[0]),
      eth: getPrice(results[1]),
      sol: getPrice(results[2]),
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5)
    };

    return NextResponse.json(prices);
  } catch (error) {
    console.error("Binance API Error:", error);
    return NextResponse.json({ btc: "0.00", eth: "0.00", sol: "0.00", time: "--:--" });
  }
}