import { NextResponse } from 'next/server';

export async function GET() {
  // 바이낸스 공식 주소가 안될 때 사용할 수 있는 대체 주소들
  const apiEndpoints = [
    'https://api.binance.com/api/v3/ticker/price',
    'https://api1.binance.com/api/v3/ticker/price',
    'https://api2.binance.com/api/v3/ticker/price',
    'https://api3.binance.com/api/v3/ticker/price'
  ];

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

  for (const url of apiEndpoints) {
    try {
      const requests = symbols.map(s => 
        fetch(`${url}?symbol=${s}`, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(3000) // 3초 안에 응답 없으면 다음 주소 시도
        }).then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
      );

      const results = await Promise.all(requests);
      
      const getPrice = (data: any) => parseFloat(data.price).toFixed(2);

      return NextResponse.json({
        btc: getPrice(results[0]),
        eth: getPrice(results[1]),
        sol: getPrice(results[2]),
        time: new Date().toLocaleTimeString('en-GB', { hour12: false })
      });

    } catch (e) {
      console.log(`${url} 실패, 다음 주소 시도 중...`);
      continue; // 현재 주소가 실패하면 다음 주소로 넘어감
    }
  }

  // 모든 주소가 실패했을 때만 에러 반환
  return NextResponse.json({ error: "All endpoints failed", btc: "0.00" }, { status: 500 });
}