'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [matrix, setMatrix] = useState<any[]>([]);
  const [timeBar, setTimeBar] = useState('1H'); // 기본값 1시간
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 선택된 시간 단위(timeBar)를 쿼리 파라미터로 전달
      const res = await fetch(`/api/market?bar=${timeBar}`);
      const data = await res.json();
      if (data.matrix) {
        setMatrix(data.matrix);
      }
    } catch (e) {
      console.error("Matrix fetch error:", e);
    }
    setLoading(false);
  };

  // timeBar가 변경될 때마다 데이터를 다시 불러옵니다.
  useEffect(() => {
    fetchData();
    // 장기 단위(1D, 1W, 1M)는 데이터가 자주 바뀌지 않으므로 갱신 주기를 조절해도 좋습니다.
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, [timeBar]);

  // ✨ 상대 강도에 따른 배경색 계산 (상승: 빨강, 하락: 파랑, 보합: 회색)
  const getCellColor = (change: number) => {
    // 변화율의 절대값에 따라 색상의 밝기(진함 정도)를 결정 (최대 255)
    const intensity = Math.min(Math.abs(change) * 35, 200); 
    
    if (change > 0.05) {
      // 상승 구간: 진한 빨강 계열
      return `rgb(${intensity + 55}, 40, 40)`;
    } else if (change < -0.05) {
      // 하락 구간: 진한 파랑 계열
      return `rgb(40, 40, ${intensity + 55})`;
    }
    // 0% 근처 보합 구간: 어두운 회색
    return '#1a1a1a';
  };

  return (
    <div className="p-4 bg-black min-h-screen text-gray-300 font-mono text-[10px]">
      {/* 헤더 영역 */}
      <header className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
        <div>
          <h1 className="text-sm font-bold text-white uppercase tracking-widest">
            Money Flow Timeline
          </h1>
          <p className="text-[8px] text-gray-500 mt-1">Sorted by OKX 24h Volume</p>
        </div>

        {/* 시간 단위 선택 버튼 (1W, 1M 포함) */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-lg">
          {['1H', '4H', '1D', '1W', '1M'].map((bar) => (
            <button
              key={bar}
              onClick={() => {
                setTimeBar(bar);
                setMatrix([]); // 전환 시 이전 데이터 초기화로 깜빡임 방지
              }}
              className={`px-3 py-1 rounded-md text-[9px] transition-all ${
                timeBar === bar
                  ? 'bg-white text-black font-bold'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {bar}
            </button>
          ))}
        </div>
      </header>

      {/* 메인 매트릭스 테이블 */}
      {loading && matrix.length === 0 ? (
        <div className="text-center py-24 text-gray-600 animate-pulse">
          Synchronizing Market Data...
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide border border-gray-800 rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900/50">
                <th className="sticky left-0 bg-gray-900 p-2 text-left border-r border-gray-800 w-20 z-20 text-white">
                  Asset
                </th>
                {matrix[0]?.history.map((h: any, i: number) => (
                  <th key={i} className="p-1 border-r border-gray-800 font-thin text-[8px] text-gray-500 min-w-[35px]">
                    {h.time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row: any) => (
                <tr key={row.symbol} className="h-6 hover:opacity-80 transition-opacity">
                  {/* 코인 이름 열 (좌측 고정) */}
                  <td className="sticky left-0 bg-[#050505] p-2 font-bold border-r border-gray-800 text-white z-10 shadow-[2px_0_10px_rgba(0,0,0,0.8)]">
                    {row.symbol}
                  </td>
                  {/* 시간대별 강도 셀 */}
                  {row.history.map((cell: any, i: number) => (
                    <td
                      key={i}
                      className="border border-black/20 relative group"
                      style={{ backgroundColor: getCellColor(cell.change) }}
                    >
                      {/* 마우스 호버 시 상세 퍼센트 표시 */}
                      <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-black text-[8px] rounded z-30 whitespace-nowrap shadow-xl">
                        {row.symbol} {cell.time}: {cell.change.toFixed(2)}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 하단 정보 및 범례 */}
      <footer className="mt-10 pt-6 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
        <div className="text-[9px]">
          &copy; 2026 Crypto Flow Visualizer • OKX SPOT API
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-blue-500 italic">Weak (Outflow)</span>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-900 via-gray-800 to-red-900 rounded-full"></div>
          <span className="text-red-500 italic">Strong (Inflow)</span>
        </div>
      </footer>
    </div>
  );
}