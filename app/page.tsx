'use client';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [history, setHistory] = useState<any[]>([]);
  const [currentTickers, setCurrentTickers] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/market');
      const data = await res.json();
      if (data.error) return;

      setCurrentTickers(data.tickers);
      setHistory(prev => {
        const updated = [...prev, { time: data.time, avg: data.avgChange * 100 }];
        return updated.length > 50 ? updated.slice(1) : updated;
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // 강도에 따른 색상 계산
  const getIntensityColor = (change: number) => {
    const val = change * 100;
    if (val > 1) return '#ff0000'; // 강세 (빨강)
    if (val < -1) return '#0000ff'; // 약세 (파랑)
    return '#444444'; // 횡보 (회색)
  };

  return (
    <div className="p-6 bg-black min-h-screen text-gray-200">
      <header className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-xl font-mono">OKX MARKET STRENGTH INDEX</h1>
        <p className="text-sm text-gray-500">Global Average Change: {history[history.length-1]?.avg.toFixed(4)}%</p>
      </header>

      {/* 상단: 전체 시장 강도 면적 그래프 */}
      <div className="bg-gray-900/50 p-4 rounded-xl mb-8 border border-gray-800">
        <h2 className="text-xs uppercase tracking-widest mb-4 text-gray-400">Total Market Momentum</h2>
        <div className="h-48">
          <ResponsiveContainer>
            <AreaChart data={history}>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip labelStyle={{color: 'black'}} />
              <Area 
                type="stepAfter" 
                dataKey="avg" 
                stroke="#fff" 
                fill={history[history.length-1]?.avg > 0 ? "#ff0000" : "#0000ff"} 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 하단: 전체 상장 코인 히트맵 (마이너 알트 포함) */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {currentTickers.sort((a,b) => b.vol - a.vol).slice(0, 100).map((coin) => (
          <div 
            key={coin.symbol} 
            className="p-2 rounded text-[10px] font-mono flex flex-col justify-between transition-colors duration-500"
            style={{ backgroundColor: getIntensityColor(coin.change), opacity: 0.8 }}
          >
            <span className="font-bold">{coin.symbol}</span>
            <span>{(coin.change * 100).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}