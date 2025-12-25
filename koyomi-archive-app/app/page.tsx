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

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        setLoading(false);
      },
    });
  }, []);

  // フィルタリングロジック
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.住民キャラ + item.住民プレイヤー + item.場所 + item.備考 + item.属性)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchMember = selectedMember === '全員' || item.暦家キャラ === selectedMember;
      return matchSearch && matchMember;
    }).reverse(); // 新しい日付順
  }, [data, searchTerm, selectedMember]);

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 p-6 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight mb-4" style={{ color: MEMBER_COLORS["暦家"] }}>
            暦家 出会い住民アーカイブ
          </h1>

          <div className="flex flex-col md:flex-row gap-4">
            {/* 検索バー */}
            <input
              type="text"
              placeholder="住民名、場所、属性で検索..."
              className="flex-1 border border-gray-200 rounded-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-[#b28c6e]/20"
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* メンバーフィルター */}
            <select
              className="border border-gray-200 rounded-full px-5 py-2 bg-white appearance-none cursor-pointer"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
            >
              <option value="全員">全メンバー表示</option>
              {Object.keys(MEMBER_COLORS).filter(k => k !== "暦家").map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid gap-4">
          {filteredData.map((item, index) => {
            const memberColor = MEMBER_COLORS[item.暦家キャラ] || "#666";
            // 背景が暗い場合にテキストを白くする簡易判定
            const isDark = memberColor === "#000b00" || memberColor === "#113c70";

            return (
              <div key={item.ID || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* 左側：メンバーラベル */}
                  <div
                    className="md:w-32 flex items-center justify-center p-3 text-sm font-bold"
                    style={{ backgroundColor: memberColor, color: isDark ? '#fff' : '#1a1a1a' }}
                  >
                    {item.暦家キャラ}
                  </div>

                  {/* 中央：情報 */}
                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-mono">{item.日付}</span>
                        {item.属性 && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">
                            {item.属性}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold">
                        {item.住民キャラ}
                        <span className="text-sm font-normal text-gray-400 ml-2">({item.住民プレイヤー})</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <span className="opacity-60">📍</span> {item.場所 || "不明"}
                      </div>
                    </div>

                    {/* 右側：ボタンと備考 */}
                    <div className="flex flex-col items-end gap-2">
                      <a
                        href={item.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                        style={{
                          borderColor: memberColor,
                          color: memberColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = memberColor;
                          e.currentTarget.style.color = isDark ? '#fff' : '#1a1a1a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = memberColor;
                        }}
                      >
                        {item.配信}で見る
                      </a>
                    </div>
                  </div>
                </div>
                {item.備考 && (
                  <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
                    備考: {item.備考}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            条件に一致する出会いが見つかりませんでした。
          </div>
        )}
      </main>
    </div>
  );
}
