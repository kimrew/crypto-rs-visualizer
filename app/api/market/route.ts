import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 바이낸스 API에서 BTC, ETH, SOL 가격 가져오기
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    const requests = symbols.map(s => 
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`)
        .then(res => res.json())
    );

    const results = await Promise.all(requests);
    
    // 사용하기 편하게 가공
    const prices = {
      btc: parseFloat(results[0].price).toFixed(2),
      eth: parseFloat(results[1].price).toFixed(2),
      sol: parseFloat(results[2].price).toFixed(2),
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5)
    };

    return NextResponse.json(prices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}