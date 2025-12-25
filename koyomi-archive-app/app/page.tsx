"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

// --- 設定 ---
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS22_uNTvQLLzkEE8BDuWMt-q4_Se9PfzC8MWJ-Z9C05PXYg5Ak0Mf5-SE5WMbZYus34xGHOLKMvULA/pub?output=csv';

const MEMBER_COLORS: { [key: string]: string } = {
  "暦家": "#b28c6e",
  "にこ": "#e7609e",
  "いん": "#113c70",
  "ゆうみ": "#2ca9e1",
  "しんあ": "#2e8b57",
  "あずみ": "#7ebea5",
  "ひるの": "#000b00",
  "みう": "#afafb0",
  "あやの": "#b7282e",
  "ゆん": "#b44c97",
  "いのん": "#f08300",
};

export default function EncounterPage() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState('全員');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          setData(results.data);
        } else {
          setError("CSVデータの取得に成功しましたが、中身が空です。");
        }
        setLoading(false);
      },
      error: (err) => {
        setError("CSVの読み込みに失敗しました: " + err.message);
        setLoading(false);
      }
    });
  }, []);

  // フィルタリングロジック（カラム名に正確に合わせました）
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const charName = item.住民キャラ || "";
      const playerName = item.住民プレイヤー || "";
      const location = item.場所 || "";
      const note = item.備考 || "";
      const attr = item.属性 || "";

      const matchSearch =
        (charName + playerName + location + note + attr)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchMember = selectedMember === '全員' || item.暦家キャラ === selectedMember;
      return matchSearch && matchMember;
    }).reverse();
  }, [data, searchTerm, selectedMember]);

  if (loading) return <div className="flex justify-center items-center h-screen font-sans text-gray-400">データを読み込み中...</div>;
  if (error) return <div className="p-10 text-red-500 font-sans">{error}</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans">
      <header className="bg-white border-b sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: MEMBER_COLORS["暦家"] }}>
            <span className="w-2 h-6 rounded-full" style={{ backgroundColor: MEMBER_COLORS["暦家"] }}></span>
            暦家 出会い住民まとめ
          </h1>

          <div className="flex gap-2 flex-1 md:max-w-xl">
            <input
              type="text"
              placeholder="住民名、場所、属性で検索..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b28c6e]/20 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer outline-none"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
            >
              <option value="全員">全員</option>
              {Object.keys(MEMBER_COLORS).filter(k => k !== "暦家").map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="grid gap-3">
          {filteredData.map((item, index) => {
            const memberColor = MEMBER_COLORS[item.暦家キャラ] || "#999";
            const isDark = memberColor === "#000b00" || memberColor === "#113c70";

            return (
              <div key={item.ID || index} className="bg-white rounded-lg border border-gray-100 shadow-sm hover:border-gray-300 transition-all overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* 左帯：キャラ名 */}
                  <div
                    className="md:w-28 flex items-center justify-center py-2 md:py-0 text-xs font-bold"
                    style={{ backgroundColor: memberColor, color: isDark ? '#fff' : '#1a1a1a' }}
                  >
                    {item.暦家キャラ}
                  </div>

                  {/* コンテンツ */}
                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">{item.日付}</span>
                        {item.属性 && (
                          <span className="text-[9px] bg-gray-50 text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded">
                            {item.属性}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-gray-800">
                        {item.住民キャラ}
                        <span className="text-xs font-normal text-gray-400 ml-2">(@{item.住民プレイヤー})</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="grayscale opacity-50">📍</span> {item.場所 || "場所不明"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.備考 && <p className="hidden lg:block text-[11px] text-gray-400 italic max-w-xs truncate">{item.備考}</p>}
                      <a
                        href={item.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 rounded text-xs font-bold transition-all border hover:bg-gray-50"
                        style={{ borderColor: memberColor, color: memberColor }}
                      >
                        {item.配信}を開く
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-300 text-sm">
            該当するデータが見つかりませんでした。
          </div>
        )}
      </main>
    </div>
  );
}
