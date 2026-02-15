// app/page.tsx (주요 변경 부분)

// ... 기존 상단 코드 ...

export default function Home() {
  const [matrix, setMatrix] = useState<any[]>([]);
  const [timeBar, setTimeBar] = useState('1H');
  const [loading, setLoading] = useState(true);

  // ... fetchData 로직 동일 (timeBar 의존성 유지) ...

  return (
    <div className="p-4 bg-black min-h-screen text-gray-300 font-mono text-[10px]">
      <header className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
        <h1 className="text-sm font-bold text-white uppercase">Money Flow Timeline</h1>
        
        {/* 시간 단위 버튼 추가: 1W, 1M 포함 */}
        <div className="flex gap-1">
          {['1H', '4H', '1D', '1W', '1M'].map(bar => (
            <button 
              key={bar} 
              onClick={() => { setTimeBar(bar); setMatrix([]); }} 
              className={`px-2 py-1 rounded text-[9px] border ${
                timeBar === bar ? 'bg-white text-black font-bold' : 'border-gray-700 text-gray-500'
              } transition-all`}
            >
              {bar}
            </button>
          ))}
        </div>
      </header>

      {/* 테이블 영역 (기존과 동일하되, bar에 따라 X축 시간 표시가 연동됨) */}
      {loading ? (
        <div className="text-center py-20 animate-pulse text-gray-600">Syncing with OKX Matrix...</div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-black p-1 text-left border border-gray-800 w-16 z-10">Asset</th>
                {matrix[0]?.history.map((h: any, i: number) => (
                  <th key={i} className="p-1 border border-gray-800 text-[8px] font-thin text-gray-500">
                    {h.time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row: any) => (
                <tr key={row.symbol} className="h-5">
                  <td className="sticky left-0 bg-black p-1 font-bold border border-gray-800 text-white z-10">
                    {row.symbol}
                  </td>
                  {row.history.map((cell: any, i: number) => (
                    <td 
                      key={i}
                      className="border border-black/30"
                      style={{ backgroundColor: getCellColor(cell.change) }}
                      title={`${row.symbol}: ${cell.change.toFixed(2)}%`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 하단 범례 추가 */}
      <footer className="mt-10 pt-4 border-t border-gray-900 flex justify-between items-center opacity-50 text-[8px]">
        <div>Data: OKX Spot Market Matrix</div>
        <div className="flex items-center gap-2">
          <span>Weak</span>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-900 via-gray-900 to-red-900"></div>
          <span>Strong</span>
        </div>
      </footer>
    </div>
  );
}

// getCellColor 함수는 기존과 동일