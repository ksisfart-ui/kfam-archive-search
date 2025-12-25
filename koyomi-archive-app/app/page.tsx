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

  // 出生順 ＆ 日付順のソート
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

  if (loading) return <div className="flex justify-center items-center h-screen bg-white font-sans text-gray-400">Loading Archive...</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans pb-20">
      <header className="bg-white border-b px-6 py-8 mb-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-3xl font-black tracking-tighter italic" style={{ color: MEMBER_INFO["暦家"] }}>KOYOMI FAMILY ARCHIVE</h1>
          <div className="h-1 w-12 bg-gray-100 my-2 rounded-full"></div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Street Graffiti Roleplay Records</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">

        {/* --- HOME VIEW --- */}
        {view === 'home' && (
          <div className="space-y-12">
            <section>
              <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Latest Encounters</h2>
                <span className="text-[10px] font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-600">{latestDate}</span>
              </div>
              {sortData(data.filter(d => d.日付 === latestDate)).map((item, i) => (
                <EncounterCard key={i} item={item} />
              ))}
              <button
                onClick={() => setView('history')}
                className="w-full py-5 mt-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-[#b28c6e] hover:border-[#b28c6e]/30 hover:bg-[#b28c6e]/5 transition-all text-xs font-bold"
              >
                過去のアーカイブをすべて見る
              </button>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('description')} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center group">
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">📖</span>
                <span className="text-xs font-bold text-gray-500">サイトの説明</span>
              </button>
              <button onClick={() => setView('history')} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center group">
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">📅</span>
                <span className="text-xs font-bold text-gray-500">日付から探す</span>
              </button>
            </div>
          </div>
        )}

        {/* --- HISTORY VIEW --- */}
        {view === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold italic">History List</h2>
              <button onClick={() => setView('home')} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">BACK TO HOME</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(new Set(data.map(d => d.日付))).sort().reverse().map(date => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setView('detail'); }}
                  className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center hover:border-[#b28c6e] hover:shadow-sm transition-all group"
                >
                  <span className="font-mono font-bold text-gray-600">{date.replace(/\//g, ' . ')}</span>
                  <span className="text-[10px] font-bold text-gray-300 group-hover:text-[#b28c6e] transition-colors">VIEW ALL →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- DETAIL VIEW --- */}
        {view === 'detail' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold italic">{selectedDate}</h2>
              </div>
              <button onClick={() => setView('history')} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">BACK TO LIST</button>
            </div>

            {/* フィルターバー（不具合修正：内部定義からインラインJSXに変更） */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-8 grid grid-cols-2 md:grid-cols-5 gap-3 shadow-sm text-[11px]">
              <select className="border-gray-100 border rounded-lg p-2 outline-none" value={filters.member} onChange={e => setFilters({...filters, member: e.target.value})}>
                <option value="全員">全メンバー</option>
                {BIRTH_ORDER.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <select className="border-gray-100 border rounded-lg p-2 outline-none" value={filters.season} onChange={e => setFilters({...filters, season: e.target.value})}>
                <option value="全員">全シーズン</option>
                <option value="Season1">Season1</option>
                <option value="Season2">Season2</option>
              </select>
              <input
                type="text" placeholder="住民名で検索..." className="border-gray-100 border rounded-lg p-2 outline-none focus:border-[#b28c6e]"
                value={filters.resident} onChange={e => setFilters({...filters, resident: e.target.value})}
              />
              <input
                type="text" placeholder="属性 (警察など)" className="border-gray-100 border rounded-lg p-2 outline-none focus:border-[#b28c6e]"
                value={filters.attr} onChange={e => setFilters({...filters, attr: e.target.value})}
              />
              <select className="border-gray-100 border rounded-lg p-2 outline-none" value={filters.platform} onChange={e => setFilters({...filters, platform: e.target.value})}>
                <option value="全員">全配信媒体</option>
                <option value="Twitch">Twitch</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            <div className="space-y-3">
              {sortData(filteredData.filter(d => d.日付 === selectedDate)).map((item, i) => (
                <EncounterCard key={i} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* --- DESCRIPTION VIEW --- */}
        {view === 'description' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold italic text-gray-400">About This Site</h2>
              <button onClick={() => setView('home')} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">BACK TO HOME</button>
            </div>
            <div className="space-y-8 text-sm text-gray-500 leading-relaxed">
              <p>このサイトは、ストグラに登場する「暦家」のメンバーが、日々の活動の中で出会った住民たちを記録するための非公式ファンサイトです。</p>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4">
                <span className="text-xl">⚠️</span>
                <p className="text-[11px]">
                  <strong>注意事項</strong><br />
                  本サイトは個人によるファン活動の一環であり、配信者様および関係者様とは一切関係ありません。情報の正確性には注意しておりますが、非公式のため抜け漏れが発生する場合があります。
                </p>
              </div>

              <section className="pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-3">Developer / Contact</h3>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">X (Twitter) :</span>
                  <a href="#" className="font-bold hover:underline">@YourSNS_ID</a>
                </div>
              </section>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- サブコンポーネント: 出会いカード ---
const EncounterCard = ({ item }: { item: any }) => {
  const memberColor = MEMBER_INFO[item.暦家キャラ] || "#666";
  return (
    <div className="bg-white border border-gray-100 rounded-2xl mb-3 flex overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="w-16 md:w-24 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white px-2 text-center leading-tight" style={{ backgroundColor: memberColor }}>
        {item.暦家キャラ}
      </div>
      <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-[10px] font-mono font-bold text-gray-300">{item.日付}</span>
            <span className="text-[9px] font-black text-[#b28c6e] bg-[#b28c6e]/10 px-2 py-0.5 rounded uppercase">{item.シーズン}</span>
            {item.属性 && <span className="text-[9px] font-bold text-blue-400">#{item.属性}</span>}
          </div>
          <div className="font-black text-gray-800 tracking-tight">
            {item.住民キャラ}
            <span className="text-[10px] font-normal text-gray-300 ml-2 tracking-normal">@{item.住民プレイヤー}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
            <span className="opacity-40 grayscale">📍</span> {item.場所 || "Location Unknown"}
          </div>
        </div>
        <a
          href={item.URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center bg-gray-900 text-white text-[10px] font-black px-6 py-2.5 rounded-full hover:bg-gray-700 transition-colors uppercase tracking-widest shadow-sm"
        >
          {item.配信}
        </a>
      </div>
    </div>
  );
};
