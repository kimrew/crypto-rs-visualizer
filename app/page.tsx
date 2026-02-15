'use client';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [history, setHistory] = useState<any[]>([]);
  const [currentTickers, setCurrentTickers] = useState<any[]>([]);
  const [timeBar, setTimeBar] = useState('1H'); // 기본 1시간

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/market?bar=${timeBar}`);
      const data = await res.json();
      if (data.error) return;

      setCurrentTickers(data.tickers);
      setHistory(prev => {
        const updated = [...prev, { time: data.time, avg: data.avgChange }];
        return updated.length > 40 ? updated.slice(1) : updated;
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, [timeBar]);

  // ✨ 1. 색상 단계별 구분 (9단계)
  const getStepColor = (change: number) => {
    if (change > 3) return '#D32F2F';      // 매우 강함 (진빨강)
    if (change > 1.5) return '#EF5350';    // 강함
    if (change > 0.5) return '#E57373';    // 약간 강함
    if (change > 0.1) return '#FFCDD2';    // 미세 강함
    if (change < -3) return '#1976D2';     // 매우 약함 (진파랑)
    if (change < -1.5) return '#42A5F5';   // 약함
    if (change < -0.5) return '#90CAF9';   // 약간 약함
    if (change < -0.1) return '#E3F2FD';   // 미세 약함
    return '#444444';                      // 중립 (회색)
  };

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen text-gray-200 font-mono">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">OKX STRENGTH MAP</h1>
          <p className="text-xs text-gray-500">Avg Change: {history[history.length-1]?.avg.toFixed(3)}%</p>
        </div>
        
        {/* ✨ 2. 시간 단위 선택 UI */}
        <div className="flex gap-2">
          {['1H', '4H', '1D'].map(bar => (
            <button
              key={bar}
              onClick={() => { setTimeBar(bar); setHistory([]); }}
              className={`px-4 py-1 text-xs rounded-full border ${
                timeBar === bar ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400'
              } transition-all`}
            >
              {bar}
            </button>
          ))}
        </div>
      </header>

      {/* 시장 흐름 면적 그래프 */}
      <div className="bg-[#111] p-6 rounded-2xl mb-8 border border-gray-800 shadow-2xl">
        <h2 className="text-[10px] uppercase tracking-[0.2em] mb-6 text-gray-500">Market Momentum ({timeBar})</h2>
        <div className="h-40">
          <ResponsiveContainer>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
              <Area type="monotone" dataKey="avg" stroke="#fff" strokeWidth={1} fill="url(#areaColor)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 세분화된 히트맵 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {currentTickers.map((coin) => (
          <div 
            key={coin.symbol} 
            className="group relative p-3 rounded-lg flex flex-col items-center justify-center transition-all duration-700 hover:scale-105"
            style={{ backgroundColor: getStepColor(coin.change) }}
          >
            <span className="text-[11px] font-black text-black/80">{coin.symbol}</span>
            <span className="text-[10px] font-bold text-black/60">{coin.change.toFixed(2)}%</span>
            
            {/* 호버 시 가격 표시 */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              ${coin.price.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}