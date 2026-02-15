"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/market');
        if (!res.ok) throw new Error('Network response was not ok');
        const newItem = await res.json();
        
        if (newItem && !newItem.error) { // 에러 데이터가 아닐 때만 추가
          setData(prev => {
            const updated = [...prev, newItem];
            return updated.length > 20 ? updated.slice(1) : updated;
          });
        }
      } catch (e) { 
        console.error("Fetch error", e); 
      }
    };

    const interval = setInterval(fetchData, 3000); // 3초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Activity className="text-green-400 w-8 h-8" /> 
          Crypto Real-time Tracker
        </h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {['BTC', 'ETH', 'SOL'].map((coin) => (
            <div key={coin} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <p className="text-zinc-400 text-sm font-medium">{coin} Price</p>
              <p className="text-2xl font-mono mt-1">
                ${data.length > 0 ? data[data.length-1][coin.toLowerCase()] : 'Loading...'}
              </p>
            </div>
          ))}
        </div>

        <div className="h-[400px] bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px'}} />
              <Line type="monotone" dataKey="btc" stroke="#F7931A" strokeWidth={3} dot={false} animationDuration={300} />
              <Line type="monotone" dataKey="eth" stroke="#627EEA" strokeWidth={3} dot={false} animationDuration={300} />
              <Line type="monotone" dataKey="sol" stroke="#14F195" strokeWidth={3} dot={false} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}