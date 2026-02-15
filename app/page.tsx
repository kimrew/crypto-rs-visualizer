'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [matrix, setMatrix] = useState<any[]>([]);
  const [timeBar, setTimeBar] = useState('1H');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market?bar=${timeBar}`);
      const data = await res.json();
      if (data.matrix) setMatrix(data.matrix);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, [timeBar]);

  // ✨ 강도에 따른 색상 함수 (0=회색, 상승=빨강, 하락=파랑)
  const getCellColor = (change: number) => {
    const abs = Math.min(Math.abs(change) * 40, 255); // 강도 조절
    if (change > 0.05) return `rgb(${abs + 50}, 50, 50)`; // 빨강 계열
    if (change < -0.05) return `rgb(50, 50, ${abs + 50})`; // 파랑 계열
    return '#222'; // 0근처는 회색(어두운색)
  };

  return (
    <div className="p-4 bg-black min-h-screen text-gray-300 font-mono text-[10px]">
      <header className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
        <h1 className="text-sm font-bold text-white uppercase tracking-tighter">Money Flow Timeline ({timeBar})</h1>
        <div className="flex gap-2">
          {['1H', '4H', '1D'].map(bar => (
            <button key={bar} onClick={() => setTimeBar(bar)} 
              className={`px-3 py-1 rounded border ${timeBar === bar ? 'bg-white text-black' : 'border-gray-700'}`}>
              {bar}
            </button>
          ))}
        </div>
      </header>

      {loading ? <div className="text-center py-20">Loading Market Matrix...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-black p-1 text-left border border-gray-800 w-16">Coin</th>
                {matrix[0]?.history.map((h: any, i: number) => (
                  <th key={i} className="p-1 border border-gray-800 rotate-45 h-12 min-w-[30px]">{h.time}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row: any) => (
                <tr key={row.symbol} className="h-6">
                  <td className="sticky left-0 bg-black p-1 font-bold border border-gray-800 text-white shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                    {row.symbol}
                  </td>
                  {row.history.map((cell: any, i: number) => (
                    <td 
                      key={i}
                      className="border border-black/50 transition-colors duration-500 hover:border-white"
                      style={{ backgroundColor: getCellColor(cell.change) }}
                      title={`${row.symbol} | ${cell.time} | ${cell.change.toFixed(2)}%`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-8 flex gap-4 items-center justify-end text-[9px] text-gray-500">
        <span>Strong Sell (Dark Blue)</span>
        <div className="w-20 h-2 bg-gradient-to-r from-blue-800 via-gray-800 to-red-800"></div>
        <span>Strong Buy (Dark Red)</span>
      </div>
    </div>
  );
}