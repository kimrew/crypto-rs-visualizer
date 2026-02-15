import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    
    // 1. 바이낸스 API 호출 (타임아웃 및 캐시 방지 설정)
    const responses = await Promise.all(
      symbols.map(s => 
        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`, { 
          next: { revalidate: 0 }, // Next.js 캐시 강제 무효화
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );

    const data = await Promise.all(responses.map(res => res.json()));

    // 2. 데이터 가공 및 검증
    const getPrice = (item: any) => {
      // 바이낸스 응답에 price가 없으면 에러 메시지를 숫자로 치환
      if (!item || !item.price) return "0.01"; 
      const num = parseFloat(item.price);
      return isNaN(num) ? "0.02" : num.toFixed(2);
    };

    const prices = {
      btc: getPrice(data[0]),
      eth: getPrice(data[1]),
      sol: getPrice(data[2]),
      time: new Date().toLocaleTimeString('en-GB', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    };

    return NextResponse.json(prices);
  } catch (error: any) {
    // 에러 발생 시 에러 메시지를 btc 가격 자리에 표시 (디버깅용)
    return NextResponse.json({ 
      btc: "Err", 
      eth: "Err", 
      sol: "Err", 
      time: "Error" 
    });
  }
}