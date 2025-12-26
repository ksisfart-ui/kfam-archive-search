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

const LOADING_MESSAGES = [
  "姉妹の記憶を整理しています...",
  "住民名簿をめくっています...",
  "記憶の断片を整理中...",
  "過去のアーカイブを探しています...",
  "姉妹の足跡を復元中。まもなく完了...",
  "過去の記憶回路への接続を開始します...",
  "ただいま資料を準備いたします..."
];

type View = 'home' | 'history' | 'description' | 'detail';

export default function KoyomiArchive() {
  const [data, setData] = useState<any[]>([]);
  const [view, setView] = useState<View>('home');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null); // ホームのアコーディオン用
  // --- 修正点：日付一覧用のフィルターステート ---
  const [historyYear, setHistoryYear] = useState('すべて');
  const [historyMonth, setHistoryMonth] = useState('すべて');

  const [filters, setFilters] = useState({
    member: '全員', resident: '', attr: '', platform: '全員', season: '全員'
  });

  useEffect(() => {
    // ランダムなメッセージを選択
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

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

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 font-sans">
      <div className="w-12 h-12 border-4 border-[#b28c6e]/20 border-t-[#b28c6e] rounded-full animate-spin mb-6"></div>
      <p className="text-slate-500 font-bold animate-pulse">{loadingMessage}</p>
    </div>
  );

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
                {BIRTH_ORDER.map((memberName) => {
                  const memberEncounters = data.filter(d => d.日付 === latestDate && d.暦家キャラ === memberName);
                  if (memberEncounters.length === 0) return null;
                  const id = `home-member-${memberName}`;
                  const isExpanded = expandedId === id;
                  return (
                    <div key={id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                      <button onClick={() => setExpandedId(isExpanded ? null : id)} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MEMBER_INFO[memberName] }}></span>
                          <span className="font-bold text-lg">{memberName}</span>
                        </div>
                        <span className={`text-slate-300 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </button>
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
                過去の記録を見る
              </button>
            </section>

            {/* 修正点：中央に「サイトの説明」ボタンのみ配置 */}
            <div className="flex justify-center">
              <button onClick={() => setView('description')} className="bg-white border border-slate-200 px-16 py-10 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center w-full md:w-1/2">
                <span className="text-4xl mb-4">📖</span>
                <span className="text-base font-bold text-slate-700">このサイトについて</span>
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

            {/* 修正点：年月フィルターの追加 */}
            <div className="flex gap-4 mb-8">
              <select
                className="flex-1 border-slate-200 border rounded-lg p-3 bg-white outline-none focus:ring-2 focus:ring-[#b28c6e]/20 text-sm font-bold"
                value={historyYear}
                onChange={(e) => setHistoryYear(e.target.value)}
              >
                <option value="すべて">すべての年</option>
                {Array.from(new Set(data.map(d => d.日付.split('/')[0]))).sort().reverse().map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select
                className="flex-1 border-slate-200 border rounded-lg p-3 bg-white outline-none focus:ring-2 focus:ring-[#b28c6e]/20 text-sm font-bold"
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
              >
                <option value="すべて">すべての月</option>
                {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => <option key={m} value={m}>{m}月</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(new Set(data.map(d => d.日付)))
                .sort().reverse()
                .filter(date => {
                  const [y, m] = date.split('/');
                  return (historyYear === 'すべて' || y === historyYear) && (historyMonth === 'すべて' || m === historyMonth);
                })
                .map(date => (
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
              <input type="text" placeholder="住民名で検索" className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.resident} onChange={e => setFilters({...filters, resident: e.target.value})} />
              <input type="text" placeholder="属性で検索" className="border-slate-200 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#b28c6e]/20" value={filters.attr} onChange={e => setFilters({...filters, attr: e.target.value})} />
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

        {/* --- サイトの説明画面 --- */}
        {view === 'description' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="flex justify-between items-center mb-10 border-b pb-4">
              <h2 className="text-2xl font-bold">このサイトについて</h2>
              <button onClick={() => setView('home')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">ホームへ戻る</button>
            </div>

            <div className="space-y-10 text-base text-slate-600 leading-relaxed">
              <section className="space-y-4">
                <p>本サイトは、ストグラに登場する「暦家」のメンバーが出会った住民のアーカイブ情報を記録・検索するための<strong>非公式ファンサイト</strong>です。</p>
              </section>

              <section className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-3">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <span>⚠️</span> 注意事項
                </h3>
                <ul className="text-sm text-amber-800 space-y-2 list-disc pl-5">
                  <li><strong>各配信者様および運営様とは一切関係ありません。</strong>また、予告なく非公開とする場合がございます。</li>
                  <li>情報の正確性には努めておりますが、有志による手動更新のため、間違いや抜け漏れが起こりうることをご了承ください。</li>
                  <li><strong>ネタバレへの配慮：</strong>本サイトには誰が誰と出会ったかという情報が含まれます。未視聴の配信がある場合はご注意ください。</li>
                  <li><strong>メタ情報の取り扱い：</strong>本サイトの情報を配信内のチャットやSNSで過度に拡散し、ロールプレイ（RP）の進行を妨げるような行為はお控えください。</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-slate-900 border-l-4 border-[#b28c6e] pl-3">情報の修正依頼について</h3>
                <p className="text-sm">記載ミスや、未掲載の出会い情報がございましたら、お手数ですが下記の制作者SNSまでDMにてお知らせいただけますと幸いです。</p>
              </section>

              <section className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">制作者 / お問い合わせ</h3>
                  <p className="font-bold text-slate-700">情報の追加・修正はこちらまで</p>
                </div>
                <a
                  href="https://x.com/admiral_splus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1DA1F2] text-white px-8 py-3 rounded-full font-bold hover:bg-[#1a91da] transition-colors flex items-center gap-2"
                >
                  アド🍉 @admiral_splus
                </a>
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
      {item.配信}
    </a>
  </div>
);
