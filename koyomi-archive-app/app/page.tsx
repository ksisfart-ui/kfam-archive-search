"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS22_uNTvQLLzkEE8BDuWMt-q4_Se9PfzC8MWJ-Z9C05PXYg5Ak0Mf5-SE5WMbZYus34xGHOLKMvULA/pub?output=csv';

const MEMBER_INFO: { [key: string]: string } = {
  "にこ": "#e7609e", "いん": "#113c70", "ゆうみ": "#2ca9e1", "しんあ": "#2e8b57",
  "あずみ": "#7ebea5", "ひるの": "#000b00", "みう": "#afafb0", "あやの": "#b7282e",
  "ゆん": "#b44c97", "いのん": "#f08300", "暦家": "#b28c6e"
};

const BIRTH_ORDER = ["にこ", "いん", "ゆうみ", "しんあ", "あずみ", "ひるの", "みう", "あやの", "ゆん", "いのん"];

type View = 'home' | 'history' | 'description' | 'detail';

export default function KoyomiArchive() {
  const [data, setData] = useState<any[]>([]);
  const [view, setView] = useState<View>('home');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

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

  const sortData = (list: any[]) => {
    return [...list].sort((a, b) => {
      if (b.日付 !== a.日付) return b.日付.localeCompare(a.日付);
      const indexA = BIRTH_ORDER.indexOf(a.暦家キャラ);
      const indexB = BIRTH_ORDER.indexOf(b.暦家キャラ);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
  };

  const filteredData = useMemo(() => {
    return data.filter(item => (
      (filters.member === '全員' || item.暦家キャラ === filters.member) &&
      (filters.season === '全員' || item.シーズン === filters.season) &&
      (filters.platform === '全員' || item.配信 === filters.platform) &&
      (item.住民キャラ + item.住民プレイヤー).toLowerCase().includes(filters.resident.toLowerCase()) &&
      (item.属性 || "").includes(filters.attr)
    ));
  }, [data, filters]);

  const latestDate = useMemo(() => {
    if (data.length === 0) return '';
    return [...data].sort((a, b) => b.日付.localeCompare(a.日付))[0].日付;
  }, [data]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-100 font-bold text-gray-600">データを読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900 font-sans pb-20">
      {/* ヘッダー：色を濃く、日本語に */}
      <header className="bg-white border-b-4 border-gray-300 px-6 py-10 mb-8 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: MEMBER_INFO["暦家"] }}>暦家出会いまとめ</h1>
          <div className="h-1.5 w-20 bg-gray-200 my-4 rounded-full"></div>
          <p className="text-base font-bold text-gray-500 uppercase tracking-widest">住民記録データベース</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">

        {/* --- ホーム画面 --- */}
        {view === 'home' && (
          <div className="space-y-12">
            <section>
              <div className="flex justify-between items-end mb-6 px-1">
                <h2 className="text-xl font-black text-gray-800 border-l-8 border-gray-900 pl-3">最新の記録</h2>
                <span className="text-base font-bold bg-gray-800 px-3 py-1 rounded text-white">{latestDate}</span>
              </div>
              {sortData(data.filter(d => d.日付 === latestDate)).map((item, i) => (
                <EncounterCard key={i} item={item} />
              ))}
              <button
                onClick={() => setView('history')}
                className="w-full py-6 mt-8 border-4 border-dashed border-gray-400 rounded-2xl text-gray-600 hover:text-black hover:border-gray-600 hover:bg-white transition-all text-lg font-black"
              >
                過去のアーカイブをすべて見る
              </button>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setView('description')} className="bg-white border-4 border-white p-10 rounded-3xl shadow-lg hover:border-gray-400 transition-all flex flex-col items-center group">
                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📖</span>
                <span className="text-xl font-black">このサイトについて</span>
              </button>
              <button onClick={() => setView('history')} className="bg-white border-4 border-white p-10 rounded-3xl shadow-lg hover:border-gray-400 transition-all flex flex-col items-center group">
                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📅</span>
                <span className="text-xl font-black">日付から探す</span>
              </button>
            </div>
          </div>
        )}

        {/* --- 日付一覧画面 --- */}
        {view === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-8 border-b-2 border-gray-300 pb-4">
              <h2 className="text-3xl font-black text-gray-800">日付別一覧</h2>
              <button onClick={() => setView('home')} className="bg-gray-800 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-black transition-colors">ホームに戻る</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(new Set(data.map(d => d.日付))).sort().reverse().map(date => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setView('detail'); }}
                  className="bg-white p-6 rounded-2xl border-2 border-gray-300 flex justify-between items-center hover:border-black hover:shadow-xl transition-all group"
                >
                  <span className="text-xl font-bold text-gray-800">{date.replace(/\//g, ' / ')}</span>
                  <span className="text-sm font-black text-gray-400 group-hover:text-black transition-colors">内容を見る →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- 詳細画面 --- */}
        {view === 'detail' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-gray-900">{selectedDate} <span className="text-lg text-gray-500 font-bold ml-2">の記録</span></h2>
              <button onClick={() => setView('history')} className="bg-gray-800 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-black transition-colors">一覧に戻る</button>
            </div>

            {/* フィルター：枠を太く、文字を大きく */}
            <div className="bg-white border-4 border-gray-300 rounded-2xl p-6 mb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 shadow-md">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-gray-500">暦家メンバー</label>
                <select className="border-2 border-gray-300 rounded-lg p-3 outline-none focus:border-black font-bold" value={filters.member} onChange={e => setFilters({...filters, member: e.target.value})}>
                  <option value="全員">全員表示</option>
                  {BIRTH_ORDER.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-gray-500">シーズン</label>
                <select className="border-2 border-gray-300 rounded-lg p-3 outline-none focus:border-black font-bold" value={filters.season} onChange={e => setFilters({...filters, season: e.target.value})}>
                  <option value="全員">全シーズン</option>
                  <option value="Season1">Season1</option>
                  <option value="Season2">Season2</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-gray-500">住民名検索</label>
                <input
                  type="text" placeholder="名前を入力..." className="border-2 border-gray-300 rounded-lg p-3 outline-none focus:border-black font-bold"
                  value={filters.resident} onChange={e => setFilters({...filters, resident: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              {sortData(filteredData.filter(d => d.日付 === selectedDate)).map((item, i) => (
                <EncounterCard key={i} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* --- サイト説明画面 --- */}
        {view === 'description' && (
          <div className="bg-white border-4 border-gray-300 rounded-3xl p-10 shadow-lg">
            <div className="flex justify-between items-center mb-10 border-b-2 border-gray-100 pb-4">
              <h2 className="text-3xl font-black text-gray-900">このサイトについて</h2>
              <button onClick={() => setView('home')} className="bg-gray-800 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-black transition-colors">ホームに戻る</button>
            </div>
            <div className="space-y-10 text-lg text-gray-700 leading-relaxed font-bold">
              <p>このサイトは、ストグラに登場する「暦家」のメンバーが、日々の活動の中で出会った住民たちを記録するための非公式ファンサイトです。</p>

              <div className="p-8 bg-red-50 rounded-2xl border-2 border-red-200 flex gap-6 items-start">
                <span className="text-4xl">⚠️</span>
                <div>
                  <h3 className="text-red-600 font-black text-xl mb-2">注意事項</h3>
                  <p className="text-red-700 text-base">
                    本サイトは個人によるファン活動の一環であり、配信者様および関係者様とは一切関係ありません。<br />
                    非公式のため、情報の抜け漏れが発生する場合があります。あらかじめご了承ください。
                  </p>
                </div>
              </div>

              <section className="bg-gray-50 p-8 rounded-2xl border-2 border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-900 inline-block">制作者・連絡先</h3>
                <div className="flex items-center gap-4 mt-4">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-black tracking-widest">X / Twitter</span>
                  <a href="#" className="text-2xl font-black text-blue-600 hover:underline">@YourSNS_ID</a>
                </div>
              </section>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- カード：文字を大きく、色を白に固定 ---
const EncounterCard = ({ item }: { item: any }) => {
  const memberColor = MEMBER_INFO[item.暦家キャラ] || "#666";
  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl mb-4 flex overflow-hidden shadow-md hover:shadow-xl transition-all">
      <div className="w-20 md:w-28 flex-shrink-0 flex items-center justify-center text-sm font-black text-white px-3 text-center leading-tight" style={{ backgroundColor: memberColor }}>
        {item.暦家キャラ}
      </div>
      <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-black bg-gray-100 text-gray-500 px-3 py-1 rounded">{item.日付}</span>
            <span className="text-sm font-black text-white bg-gray-900 px-3 py-1 rounded uppercase tracking-widest">{item.シーズン}</span>
            {item.属性 && <span className="text-sm font-black text-blue-600 border-2 border-blue-600 px-3 py-0.5 rounded-full">#{item.属性}</span>}
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tighter">
            {item.住民キャラ}
            <span className="text-base font-bold text-gray-400 ml-4">配信者：{item.住民プレイヤー}</span>
          </div>
          <div className="text-base text-gray-600 font-bold flex items-center gap-2">
            <span className="text-xl">📍</span> 会った場所：{item.場所 || "（不明）"}
          </div>
          {item.備考 && <div className="text-sm bg-gray-50 p-3 rounded border-l-4 border-gray-300 text-gray-500 font-bold">{item.備考}</div>}
        </div>
        <a
          href={item.URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center bg-gray-900 text-white text-base font-black px-10 py-4 rounded-full hover:bg-black transition-all shadow-lg active:scale-95"
        >
          アーカイブを開く
        </a>
      </div>
    </div>
  );
};
