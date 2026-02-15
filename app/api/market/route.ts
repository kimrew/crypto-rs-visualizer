import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. 가져올 코인 쌍 정의 (바이낸스는 USDT 기준)
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    
    // 2. 바이낸스 API 호출 (api1을 사용하여 차단 가능성 최소화)
    const requests = symbols.map(s => 
      fetch(`https://api1.binance.com/api/v3/ticker/price?symbol=${s}`, {
        cache: 'no-store', // 데이터 캐싱 방지 (항상 새 데이터)
        next: { revalidate: 0 }
      }).then(res => {
        if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
        return res.json();
      })
    );

    const results = await Promise.all(requests);
    
    // 3. 데이터 가공 함수 (숫자 변환 및 에러 체크)
    const getPrice = (data: any) => {
      if (!data || !data.price) return "0.00";
      const num = parseFloat(data.price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    };

    // 4. 최종 응답 객체 생성
    const prices = {
      btc: getPrice(results[0]),
      eth: getPrice(results[1]),
      sol: getPrice(results[2]),
      // 현재 시간을 '시:분:초' 형태로 추가
      time: new Date().toLocaleTimeString('en-GB', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    };

    return NextResponse.json(prices);

  } catch (error: any) {
    console.error("API Route Error:", error.message);
    // 에러 발생 시 프론트엔드에서 인지할 수 있도록 에러 값 반환
    return NextResponse.json(
      { error: "Failed to fetch prices", btc: "0.00", eth: "0.00", sol: "0.00" },
      { status: 500 }
    );
  }
}