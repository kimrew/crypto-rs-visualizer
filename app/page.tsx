'use client';

import { useEffect, useState } from 'react';

export default function RSVisualizer() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setIntervalValue] = useState('1h');

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/market?interval=${interval}`);
      const result = await res.json();
      
      // API 응답 구조가 { data: [...] } 인지 확인 후 저장
      if (result && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        console.warn('Data format is not an array:', result);
        setData([]);
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60000); // 1분마다 갱신
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      {/* 헤더 섹션 */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-yellow-500 uppercase">
            Minervini RS Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            시장 지수(TOTAL) 대비 상대적 강세를 보이는 주도주 발굴
          </p>
        </div>

        {/* 타임프레임 선택 */}
        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
          {['1h', '4h', '1d'].map((t) => (
            <button
              key={t}
              onClick={() => setIntervalValue(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                interval === t ? 'bg-yellow-500 text-black' : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-500 space-y-4">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse">시장 데이터를 분석하고 있습니다...</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data?.length > 0 ? (
            data.map((item: any) => {
              // 안전한 데이터 추출을 위한 기본값 설정
              const symbol = item?.symbol || 'UNKNOWN';
              const rsRating = Number(item?.rs_rating || 0);
              const changeP = Number(item?.change_p || 0);
              const price = Number(item?.current_price || 0);
              
              const isLeader = rsRating >= 90;
              const isStrong = rsRating >= 70 && rsRating < 90;

              return (
                <div
                  key={symbol}
                  className={`relative overflow-hidden p-5 rounded-xl border transition-all hover:border-gray-500 ${
                    isLeader 
                      ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-black shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
                      : isStrong 
                        ? 'border-blue-500 bg-gray-900/50' 
                        : 'border-gray-800 bg-gray-900/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold tracking-tight">
                      {symbol.replace('USDT', '')}
                    </span>
                    {isLeader && (
                      <span className="text-[10px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded italic">
                        LEADER
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-1 mb-2">
                    <span className={`text-4xl font-black leading-none ${isLeader ? 'text-yellow-500' : 'text-white'}`}>
                      {rsRating}
                    </span>
                    <span className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-tighter">RS Rating</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className={`text-sm font-bold ${changeP >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {changeP >= 0 ? '+' : ''}{changeP.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      ${price > 1 ? price.toLocaleString() : price.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500">조회된 데이터가 없습니다. 트레이딩뷰 웹훅 데이터가 DB에 쌓일 때까지 잠시만 기다려주세요.</p>
              <button 
                onClick={fetchData}
                className="mt-4 text-yellow-500 text-sm hover:underline"
              >
                데이터 수동 갱신 시도
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}