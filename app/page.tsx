'use client';

import { useEffect, useState } from 'react';

export default function RSVisualizer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState('1h'); // 기본 1시간 설정

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market?interval=${interval}`);
        const result = await res.json();
        if (result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Data fetch error:', error);
      }
      setLoading(false);
    };

    fetchData();
    // 1분마다 자동 새로고침 (웹훅 데이터 반영 확인용)
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* 헤더 섹션 */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-yellow-500">
            MINERVINI RS TRACKER
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            시장 지수(TOTAL) 대비 상대적 강세를 보이는 주도주 발굴
          </p>
        </div>

        {/* 타임프레임 선택 버튼 */}
        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
          {['1h', '4h', '1d'].map((t) => (
            <button
              key={t}
              onClick={() => setInterval(t)}
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
        <div className="flex justify-center items-center h-64 text-gray-500 animate-pulse">
          시장 주도주 분석 중...
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((item: any) => {
            const isLeader = item.rs_rating >= 90;
            const isStrong = item.rs_rating >= 70 && item.rs_rating < 90;

            return (
              <div
                key={item.symbol}
                className={`relative overflow-hidden p-5 rounded-xl border transition-all hover:scale-[1.02] ${
                  isLeader 
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-black shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                    : isStrong 
                      ? 'border-blue-500 bg-gray-900/50' 
                      : 'border-gray-800 bg-gray-900/30'
                }`}
              >
                {/* 배경 장식 (Leader 전용) */}
                {isLeader && (
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-500 rotate-45 opacity-20" />
                )}

                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold tracking-tight">
                    {item.symbol.replace('USDT', '')}
                  </span>
                  {isLeader && (
                    <span className="text-[10px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded italic">
                      LEADER
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-black leading-none ${isLeader ? 'text-yellow-500' : 'text-white'}`}>
                    {item.rs_rating}
                  </span>
                  <span className="text-xs text-gray-500 font-bold mb-1">RS RATING</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className={`text-sm font-bold ${item.change_p >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {item.change_p >= 0 ? '+' : ''}{item.change_p.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    ${item.current_price > 1 ? item.current_price.toLocaleString() : item.current_price.toFixed(4)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 데이터 없을 때 안내 */}
      {!loading && data.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-gray-500">데이터가 없습니다. 트레이딩뷰 웹훅 신호를 기다려주세요.</p>
        </div>
      )}
    </div>
  );
}