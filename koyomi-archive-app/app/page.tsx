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
  const [expandedId, setExpandedId] = useState<string | null>(null); // ホームのアコーディオン用

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
    return data.filter(item => {
      // 検索対象に「読み」を含める
      const residentSearchBase = (item.住民キャラ || "") + (item.住民キャラ読み || "") + (item.住民プレイヤー || "");
      const attrSearchBase = (item.属性 || "") + (item.属性読み || "");

      return (
        (filters.member === '全員' || item.暦家キャラ === filters.member) &&
        (filters.season === '全員' || item.シーズン === filters.season) &&
        (filters.platform === '全員' || item.配信 === filters.platform) &&
        residentSearchBase.toLowerCase().includes(filters.resident.toLowerCase()) &&
        attrSearchBase.toLowerCase().includes(filters.attr.toLowerCase())
      );
    });
  }, [data, filters]);

  const latestDate = useMemo(() => {
    if (data.length === 0) return '';
    return [...data].sort((a, b) => b.日付.localeCompare(a.日付))[0].日付;
  }, [data]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-white font-sans text-slate-500 text-lg">データを読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      <header className="bg-white border-b px-6 py-10 mb-8 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: MEMBER_INFO["暦家"] }}>
            暦家 住民アーカイブ検索
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2 tracking-widest uppercase">Unofficial Archive Records</p>
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
              <div className="space-y-2">
                {/* 姉妹の出生順に従って、その日のデータをグループ化して表示 */}
                {BIRTH_ORDER.map((memberName) => {
                  // 最新の日付において、該当するメンバーのデータを抽出
                  const memberEncounters = data.filter(d => d.日付 === latestDate && d.暦家キャラ === memberName);
                  if (memberEncounters.length === 0) return null;

                  const id = `home-member-${memberName}`;
                  const isExpanded = expandedId === id;
                  return (
                    <div key={id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                      {/* アコーディオンのヘッダー：メンバー名のみを表示 */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : id)}
                        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MEMBER_INFO[memberName] }}></span>
                          <span className="font-bold text-lg">{memberName}</span>
                        </div>
                        <span className={`text-slate-300 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {/* アコーディオンの中身：出会った住民のリスト */}
                      {isExpanded && (
                        <div className="px-5 pb-2 animate-in fade-in slide-in-from-top-1 duration-200 divide-y divide-slate-100">
                          {memberEncounters.map((item, idx) => (
                            <div key={idx} className="py-5 first:pt-0 last:pb-3">
                              <EncounterCardContent item={item} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setView('history')} className="w-full py-6 mt-8 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-[#b28c6e] hover:border-[#b28c6e] hover:bg-white transition-all text-base font-bold">
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
                <button key={date} onClick={() => { setSelectedDate(date); setView('detail'); }} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center hover:border-[#b28c6e] hover:shadow-md transition-all group">
                  <span className="font-mono text-lg font-bold text-slate-700">{date.replace(/\//g, ' / ')}</span>
                  <span className="text-sm font-bold text-slate-400 group-hover:text-[#b28c6e]">⇒</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- 詳細表示画面 --- */}
        {view === 'detail' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedDate}</h2>
              <button onClick={() => setView('history')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">一覧へ戻る</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 grid grid-cols-2 md:grid-cols-5 gap-4 shadow-sm text-sm">
              <select className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.member} onChange={e => setFilters({...filters, member: e.target.value})}>
                <option value="全員">全メンバー</option>
                {BIRTH_ORDER.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <select className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.season} onChange={e => setFilters({...filters, season: e.target.value})}>
                <option value="全員">全シーズン</option>
                <option value="S1">Season1</option>
                <option value="S2">Season2</option>
              </select>
              <input type="text" placeholder="住民名・読みで検索" className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.resident} onChange={e => setFilters({...filters, resident: e.target.value})} />
              <input type="text" placeholder="属性・読みで検索" className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.attr} onChange={e => setFilters({...filters, attr: e.target.value})} />
              <select className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.platform} onChange={e => setFilters({...filters, platform: e.target.value})}>
                <option value="全員">全媒体</option>
                <option value="Twitch">Twitch</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            <div className="space-y-4">
              {sortData(filteredData.filter(d => d.日付 === selectedDate)).map((item, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex shadow-sm">
                   <div className="w-20 md:w-28 flex-shrink-0 flex items-center justify-center text-sm font-black text-white px-2 text-center" style={{ backgroundColor: MEMBER_INFO[item.暦家キャラ] || "#666" }}>
                    {item.暦家キャラ}
                  </div>
                  <div className="flex-1 p-6">
                    <EncounterCardContent item={item} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 説明画面 --- */}
        {view === 'description' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm">
            <div className="flex justify-between items-center mb-10 border-b pb-4">
              <h2 className="text-2xl font-bold">このサイトについて</h2>
              <button onClick={() => setView('home')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">ホームへ戻る</button>
            </div>
            <div className="space-y-6 text-base text-slate-600 leading-relaxed">
              <p>本サイトは、ストグラに登場する「暦家」のメンバーが、日々の活動で出会った住民たちを記録・検索するための非公式ファンサイトです。</p>
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 text-sm text-amber-800">
                <span className="text-2xl">⚠️</span>
                <p>各配信者様および運営様とは一切関係ありません。情報の正確性には努めておりますが、抜け漏れ等が発生する場合がございます。</p>
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

// --- カードの中身を共通化 ---
const EncounterCardContent = ({ item }: { item: any }) => (
  <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono font-bold text-slate-500">{item.日付}</span>
        <span className="text-[10px] font-black text-[#b28c6e] bg-[#b28c6e]/10 px-2 py-1 rounded uppercase">{item.シーズン}</span>
        {item.属性 && <span className="text-[11px] font-bold text-blue-600">#{item.属性}</span>}
      </div>
      <div className="text-xl font-bold text-slate-900 tracking-tight">
        {item.住民キャラ}
        <span className="text-sm font-normal text-slate-500 ml-3">
          {item.プレイヤーX ? (
            <a href={item.プレイヤーX} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline decoration-slate-300">
              @{item.住民プレイヤー}
            </a>
          ) : (
            `@${item.住民プレイヤー}`
          )}
        </span>
      </div>
      <div className="text-sm text-slate-500 flex items-center gap-1 font-medium">
        <span className="opacity-60 grayscale">📍</span> {item.場所 || "場所不明"}
        {item.備考 && <span className="ml-4 text-slate-400 text-xs">｜ {item.備考}</span>}
      </div>
    </div>
    <a href={item.URL} target="_blank" rel="noopener noreferrer" className="text-center bg-slate-900 text-white text-[11px] font-bold px-6 py-3 rounded-full hover:bg-slate-700 transition-colors tracking-widest shadow-sm">
      {item.配信}を開く
    </a>
  </div>
);
