"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS22_uNTvQLLzkEE8BDuWMt-q4_Se9PfzC8MWJ-Z9C05PXYg5Ak0Mf5-SE5WMbZYus34xGHOLKMvULA/pub?output=csv';

// --- 設定 ---
const MEMBER_INFO: { [key: string]: string } = {
  "にこ": "#e7609e", "いん": "#113c70", "ゆうみ": "#2ca9e1", "しんあ": "#2e8b57",
  "あずみ": "#7ebea5", "ひるの": "#000b00", "みう": "#afafb0", "あやの": "#b7282e",
  "ゆん": "#b44c97", "いのん": "#f08300", "暦家": "#b28c6e"
};

// 出生順の定義
const BIRTH_ORDER = ["にこ", "いん", "ゆうみ", "しんあ", "あずみ", "ひるの", "みう", "あやの", "ゆん", "いのん"];

type View = 'home' | 'history' | 'description' | 'detail';

export default function KoyomiArchive() {
  const [data, setData] = useState<any[]>([]);
  const [view, setView] = useState<View>('home');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  // フィルター用ステート
  const [filters, setFilters] = useState({
    member: '全員', resident: '', attr: '', platform: '全員', season: '全員'
  });

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        setLoading(false);
      }
    });
  }, []);

  // --- データ処理ロジック ---

  // 出生順 ＆ 日付順のソート関数
  const sortData = (list: any[]) => {
    return [...list].sort((a, b) => {
      // 1. 日付で比較
      if (b.日付 !== a.日付) return b.日付.localeCompare(a.日付);
      // 2. 出生順で比較
      return BIRTH_ORDER.indexOf(a.暦家キャラ) - BIRTH_ORDER.indexOf(b.暦家キャラ);
    });
  };

  // フィルタリング
  const filteredData = useMemo(() => {
    return data.filter(item => (
      (filters.member === '全員' || item.暦家キャラ === filters.member) &&
      (filters.season === '全員' || item.シーズン === filters.season) &&
      (filters.platform === '全員' || item.配信 === filters.platform) &&
      (item.住民キャラ + item.住民プレイヤー).toLowerCase().includes(filters.resident.toLowerCase()) &&
      item.属性.includes(filters.attr)
    ));
  }, [data, filters]);

  // 最新の日付を取得
  const latestDate = useMemo(() => {
    if (data.length === 0) return '';
    return [...data].sort((a, b) => b.日付.localeCompare(a.日付))[0].日付;
  }, [data]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-white">読み込み中...</div>;

  // --- コンポーネント: フィルターバー ---
  const FilterBar = () => (
    <div className="bg-white border rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 shadow-sm text-sm">
      <select className="border rounded p-2" value={filters.member} onChange={e => setFilters({...filters, member: e.target.value})}>
        <option value="全員">全メンバー</option>
        {BIRTH_ORDER.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
      <select className="border rounded p-2" value={filters.season} onChange={e => setFilters({...filters, season: e.target.value})}>
        <option value="全員">全シーズン</option>
        <option value="Season1">Season1</option>
        <option value="Season2">Season2</option>
      </select>
      <input
        type="text" placeholder="住民名で検索..." className="border rounded p-2"
        value={filters.resident} onChange={e => setFilters({...filters, resident: e.target.value})}
      />
      <input
        type="text" placeholder="属性 (警察など)" className="border rounded p-2"
        value={filters.attr} onChange={e => setFilters({...filters, attr: e.target.value})}
      />
      <select className="border rounded p-2" value={filters.platform} onChange={e => setFilters({...filters, platform: e.target.value})}>
        <option value="全員">全配信媒体</option>
        <option value="Twitch">Twitch</option>
        <option value="YouTube">YouTube</option>
      </select>
    </div>
  );

  // --- コンポーネント: 出会いカード ---
  const EncounterCard = ({ item }: { item: any }) => (
    <div className="bg-white border rounded-lg mb-3 flex overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="w-20 md:w-28 flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-bold text-white" style={{ backgroundColor: MEMBER_INFO[item.暦家キャラ] || "#666" }}>
        {item.暦家キャラ}
      </div>
      <div className="flex-1 p-3 md:p-4 flex flex-col md:flex-row justify-between md:items-center gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[10px] text-gray-400">
            <span>{item.日付}</span>
            <span className="bg-gray-100 px-1 rounded">{item.シーズン}</span>
            {item.属性 && <span className="text-blue-500">#{item.属性}</span>}
          </div>
          <div className="font-bold text-sm md:text-base">
            {item.住民キャラ} <span className="text-gray-400 font-normal text-xs">(@{item.住民プレイヤー})</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">📍 {item.場所}</div>
        </div>
        <a href={item.URL} target="_blank" className="text-center bg-gray-900 text-white text-[10px] md:text-xs px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
          {item.配信}を開く
        </a>
      </div>
    </div>
  );

  // --- 各ビューのレンダリング ---

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {/* 共通ヘッダー */}
      <header className="bg-white border-b p-6 mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tighter" style={{ color: MEMBER_INFO["暦家"] }}>KOYOMI FAMILY ARCHIVE</h1>
        <p className="text-xs text-gray-400 mt-1">暦家が出会った住民たちの記録</p>
      </header>

      <div className="max-w-4xl mx-auto px-4">

        {/* --- HOME VIEW --- */}
        {view === 'home' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-bold mb-4 border-l-4 border-gray-900 pl-2">最新の出会い ({latestDate})</h2>
              {sortData(filteredData.filter(d => d.日付 === latestDate)).map((item, i) => (
                <EncounterCard key={i} item={item} />
              ))}
              <button
                onClick={() => setView('history')}
                className="w-full py-4 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all text-sm font-bold"
              >
                過去のアーカイブをすべて見る
              </button>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('description')} className="bg-white border p-6 rounded-2xl shadow-sm hover:bg-gray-50 transition-all">
                <span className="block text-2xl mb-2">📖</span>
                <span className="text-sm font-bold">サイトの説明</span>
              </button>
              <button onClick={() => setView('history')} className="bg-white border p-6 rounded-2xl shadow-sm hover:bg-gray-50 transition-all">
                <span className="block text-2xl mb-2">📅</span>
                <span className="text-sm font-bold">日付から探す</span>
              </button>
            </div>
          </div>
        )}

        {/* --- HISTORY VIEW --- */}
        {view === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">日付一覧</h2>
              <button onClick={() => setView('home')} className="text-sm text-gray-400">← 戻る</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from(new Set(data.map(d => d.日付))).sort().reverse().map(date => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setView('detail'); }}
                  className="bg-white p-4 rounded-xl border flex justify-between items-center hover:border-gray-900 transition-all"
                >
                  <span className="font-mono font-bold">{date.replace(/\//g, ' . ')}</span>
                  <span className="text-xs text-gray-300">表示 →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- DETAIL VIEW --- */}
        {view === 'detail' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{selectedDate} の出会い</h2>
              <button onClick={() => setView('history')} className="text-sm text-gray-400">← 日付一覧に戻る</button>
            </div>
            <FilterBar />
            {sortData(filteredData.filter(d => d.日付 === selectedDate)).map((item, i) => (
              <EncounterCard key={i} item={item} />
            ))}
          </div>
        )}

        {/* --- DESCRIPTION VIEW --- */}
        {view === 'description' && (
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">このサイトについて</h2>
              <button onClick={() => setView('home')} className="text-sm text-gray-400">← 戻る</button>
            </div>
            <div className="prose prose-sm text-gray-600 leading-relaxed space-y-4">
              <p>このサイトは、ストグラに登場する「暦家」のメンバーがいつ、誰と出会ったかをアーカイブするための非公式ファンサイトです。</p>
              <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700 text-xs">
                <strong>【注意事項】</strong><br />
                ・配信者様および関係者様とは一切関係ありません。<br />
                ・情報の正確性には細心の注意を払っていますが、抜け漏れがある場合があります。
              </div>
              <section>
                <h3 className="font-bold text-gray-900">制作者 / SNS</h3>
                <p>不具合や追加の希望などありましたら、以下までご連絡ください。</p>
                <a href="#" className="text-blue-500 underline">@YourSNS_ID</a>
              </section>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
