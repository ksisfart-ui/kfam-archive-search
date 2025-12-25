"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS22_uNTvQLLzkEE8BDuWMt-q4_Se9PfzC8MWJ-Z9C05PXYg5Ak0Mf5-SE5WMbZYus34xGHOLKMvULA/pub?output=csv';

// メンバーカラー設定
const MEMBER_INFO: { [key: string]: string } = {
  "にこ": "#e7609e", "いん": "#113c70", "ゆうみ": "#2ca9e1", "しんあ": "#2e8b57",
  "あずみ": "#7ebea5", "ひるの": "#000b00", "みう": "#afafb0", "あやの": "#b7282e",
  "ゆん": "#b44c97", "いのん": "#f08300", "暦家": "#b28c6e"
};

// 出生順の設定
const BIRTH_ORDER = ["にこ", "いん", "ゆうみ", "しんあ", "あずみ", "ひるの", "みう", "あやの", "ゆん", "いのん"];

type View = 'home' | 'history' | 'description' | 'detail';

export default function KoyomiArchive() {
  const [data, setData] = useState<any[]>([]);
  const [view, setView] = useState<View>('home');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  // フィルター用
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

  // 並び替えロジック（日付降順 ＞ 出生順昇順）
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

  if (loading) return <div className="flex justify-center items-center h-screen bg-white font-sans text-gray-500 text-lg">データを読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* ヘッダー */}
      <header className="bg-white border-b px-6 py-10 mb-8 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: MEMBER_INFO["暦家"] }}>
            暦家 出会いアーカイブ
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2 tracking-widest">STREET GRAFFITI ROLEPLAY RECORDS</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">

        {/* --- ホーム画面 --- */}
        {view === 'home' && (
          <div className="space-y-12">
            <section>
              <div className="flex justify-between items-end mb-6 px-1">
                <h2 className="text-base font-bold text-slate-600 border-b-2 border-slate-200 pb-1">最新の記録</h2>
                <span className="text-sm font-mono bg-slate-200 px-3 py-1 rounded-md text-slate-700 font-bold">{latestDate}</span>
              </div>
              {sortData(data.filter(d => d.日付 === latestDate)).map((item, i) => (
                <EncounterCard key={i} item={item} />
              ))}
              <button
                onClick={() => setView('history')}
                className="w-full py-6 mt-6 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-[#b28c6e] hover:border-[#b28c6e] hover:bg-white transition-all text-base font-bold"
              >
                過去の日付一覧を見る
              </button>
            </section>

            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => setView('description')} className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center">
                <span className="text-4xl mb-4">📖</span>
                <span className="text-base font-bold text-slate-700">サイトの説明</span>
              </button>
              <button onClick={() => setView('history')} className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center">
                <span className="text-4xl mb-4">📅</span>
                <span className="text-base font-bold text-slate-700">日付から探す</span>
              </button>
            </div>
          </div>
        )}

        {/* --- 日付一覧画面 --- */}
        {view === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">アーカイブ一覧</h2>
              <button onClick={() => setView('home')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">ホームへ戻る</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(new Set(data.map(d => d.日付))).sort().reverse().map(date => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setView('detail'); }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center hover:border-[#b28c6e] hover:shadow-md transition-all group"
                >
                  <span className="font-mono text-lg font-bold text-slate-700">{date.replace(/\//g, ' / ')}</span>
                  <span className="text-sm font-bold text-slate-400 group-hover:text-[#b28c6e]">一覧を表示 →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- 詳細表示画面 --- */}
        {view === 'detail' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedDate} の出会い</h2>
              <button onClick={() => setView('history')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">一覧へ戻る</button>
            </div>

            {/* 検索・絞り込みバー */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 grid grid-cols-2 md:grid-cols-5 gap-4 shadow-sm text-sm">
              <select className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.member} onChange={e => setFilters({...filters, member: e.target.value})}>
                <option value="全員">全メンバー</option>
                {BIRTH_ORDER.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <select className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.season} onChange={e => setFilters({...filters, season: e.target.value})}>
                <option value="全員">全シーズン</option>
                <option value="Season1">Season1</option>
                <option value="Season2">Season2</option>
              </select>
              <input
                type="text" placeholder="住民名で検索" className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20"
                value={filters.resident} onChange={e => setFilters({...filters, resident: e.target.value})}
              />
              <input
                type="text" placeholder="属性検索" className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20"
                value={filters.attr} onChange={e => setFilters({...filters, attr: e.target.value})}
              />
              <select className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.platform} onChange={e => setFilters({...filters, platform: e.target.value})}>
                <option value="全員">全配信媒体</option>
                <option value="Twitch">Twitch</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            <div className="space-y-4">
              {sortData(filteredData.filter(d => d.日付 === selectedDate)).map((item, i) => (
                <EncounterCard key={i} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* --- サイトの説明画面 --- */}
        {view === 'description' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm">
            <div className="flex justify-between items-center mb-10 border-b pb-4">
              <h2 className="text-2xl font-bold">サイトの説明</h2>
              <button onClick={() => setView('home')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">ホームへ戻る</button>
            </div>
            <div className="space-y-10 text-base text-slate-600 leading-relaxed">
              <section>
                <p>このサイトは、ストグラに登場する「暦家」のメンバーが、日々の活動で出会った住民たちを記録・検索するための非公式アーカイブです。</p>
              </section>

              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm text-amber-800 font-medium">
                  <strong>注意事項</strong><br />
                  本サイトはファン活動の一環であり、各配信者様およびストグラ運営様とは一切関係ありません。情報の正確性には努めておりますが、抜け漏れ等が発生する場合がございます。
                </p>
              </div>

              <section className="bg-slate-50 p-8 rounded-2xl">
                <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">制作者・お問い合わせ</h3>
                <div className="flex items-center gap-3">
                  <span className="bg-white px-4 py-2 rounded-lg border border-slate-200 font-bold">アド🍉</span>
                  <a href="https://x.com/admiral_splus" className="text-[#b28c6e] font-bold hover:underline text-lg">@admiral_splus</a>
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
    <div className="bg-white border border-slate-200 rounded-2xl flex overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* 暦家メンバーラベル */}
      <div className="w-20 md:w-28 flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-black text-white px-2 text-center leading-tight" style={{ backgroundColor: memberColor }}>
        {item.暦家キャラ}
      </div>

      {/* 情報エリア */}
      <div className="flex-1 p-5 md:p-6 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono font-bold text-slate-500">{item.日付}</span>
            <span className="text-[10px] font-black text-[#b28c6e] bg-[#b28c6e]/10 px-2 py-1 rounded uppercase">{item.シーズン}</span>
            {item.属性 && <span className="text-[11px] font-bold text-blue-600">#{item.属性}</span>}
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {item.住民キャラ}
            <span className="text-sm font-normal text-slate-500 ml-3">@{item.住民プレイヤー}</span>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1 font-medium">
            <span className="opacity-60 grayscale">📍</span> {item.場所 || "場所不明"}
          </div>
        </div>

        {/* ボタン（サイズは変えず、中の文字のみ強調） */}
        <a
          href={item.URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center bg-slate-900 text-white text-[11px] font-bold px-6 py-3 rounded-full hover:bg-slate-700 transition-colors tracking-widest shadow-sm"
        >
          {item.配信}を開く
        </a>
      </div>
    </div>
  );
};
