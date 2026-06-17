import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, FileText, TrendingUp, TrendingDown, RefreshCcw, Loader2, Volume2, Square, Calendar, Clock, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Wallet, Transaction } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AiAdvisorTabProps {
  wallets: Wallet[];
  transactions: Transaction[];
  formatRupiah: (number: number) => string;
}

const COLORS = ['#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#84cc16'];

export default function AiAdvisorTab({ wallets, transactions, formatRupiah }: AiAdvisorTabProps) {
  const [advice, setAdvice] = useState<string>('');
  const [chartData, setChartData] = useState<any>(null);

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [evaluatedTransactions, setEvaluatedTransactions] = useState<Transaction[]>([]);
  const [evaluatedWallets, setEvaluatedWallets] = useState<Wallet[]>([]);

  // Date Filters
  const [dateRange, setDateRange] = useState<string>('bulan_ini');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // History
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'evaluate' | 'history'>('evaluate');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'history') {
      fetchHistory();
    }
  }, [viewMode]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/advisor/history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistoryList(data);
      } else {
        console.error("API did not return an array:", data);
        setHistoryList([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadHistoryItem = (item: any) => {
    setAdvice(item.advice);
    try {
      if (item.chartData) setChartData(JSON.parse(item.chartData));
      else setChartData(null);
    } catch (e) { setChartData(null); }

    setDateRange(item.dateRange);
    setViewMode('evaluate');
    // Set dummy evaluated tx just to show we loaded history, or we could fetch them.
    setEvaluatedTransactions([]);
    setEvaluatedWallets(wallets);
  };

  const getTotalBalance = (wals: Wallet[]) => wals.reduce((sum, w) => sum + w.balance, 0);

  const getFinancialAdvice = async () => {
    setIsEvaluating(true);
    setEvaluatedWallets(wallets);

    // Filter TX locally for UI context
    let filteredTx = [...transactions];
    const now = new Date();
    if (dateRange === 'hari_ini') {
      const start = new Date(now.setHours(0, 0, 0, 0));
      filteredTx = filteredTx.filter(t => new Date(t.date) >= start);
    } else if (dateRange === 'bulan_ini') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredTx = filteredTx.filter(t => new Date(t.date) >= start);
    } else if (dateRange === 'tahun_ini') {
      const start = new Date(now.getFullYear(), 0, 1);
      filteredTx = filteredTx.filter(t => new Date(t.date) >= start);
    } else if (dateRange === 'custom' && customStart && customEnd) {
      const start = new Date(customStart).setHours(0, 0, 0, 0);
      const end = new Date(customEnd).setHours(23, 59, 59, 999);
      filteredTx = filteredTx.filter(t => {
        const time = new Date(t.date).getTime();
        return time >= start && time <= end;
      });
    }
    setEvaluatedTransactions(filteredTx);

    if (isSpeaking && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          customStart,
          customEnd
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setAdvice(data.advice || "Gagal mendapatkan evaluasi.");
      if (data.chartData) {
        try {
          setChartData(JSON.parse(data.chartData));
        } catch (e) { setChartData(null); }
      } else {
        setChartData(null);
      }
    } catch (error) {
      setAdvice("Terjadi kesalahan koneksi saat meminta evaluasi AI. Silakan coba lagi.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const exportToPdf = async () => {
    if (!advice || !pdfContainerRef.current) return;

    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = pdfContainerRef.current;
      const opt = {
        margin: 15,
        filename: "Laporan_AI_Advisor_" + new Date().toISOString().split('T')[0] + ".pdf",
        image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
      };
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Gagal mengekspor PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    } else {
      if (!advice) return;
      window.speechSynthesis.cancel();

      // Bersihkan teks dari simbol markdown dan perbaiki bacaan
      let cleanText = advice
        .replace(/[*#_`\[\]()\-:]/g, ' ') // Ganti simbol dengan spasi agar kata tidak menempel
        .replace(/\bRp\b/g, 'Rupiah') // Perbaiki bacaan Rp
        .replace(/Rp\./g, 'Rupiah ')
        .replace(/Rp /g, 'Rupiah ')
        .replace(/(?<=\d)\.(?=\d)/g, ''); // Hapus titik dalam angka agar tidak dieja putus-putus

      const sentences = cleanText.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 0);

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      utterancesRef.current = [];

      let currentIndex = 0;

      // Panggil getVoices() agar browser memuat daftar suara (workaround untuk Chrome)
      window.speechSynthesis.getVoices();

      const speakNextChunk = () => {
        if (!isSpeakingRef.current) return;
        if (currentIndex >= sentences.length) {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          return;
        }

        const chunk = sentences[currentIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);

        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID');
        if (idVoice) utterance.voice = idVoice;
        else utterance.lang = 'id-ID';

        utterance.rate = 1.15;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          currentIndex++;
          setTimeout(() => speakNextChunk(), 200); // Jeda kecil antar kalimat agar natural
        };
        utterance.onerror = (e) => {
          if (isSpeakingRef.current) {
            console.error("TTS Error:", e);
          }
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        };

        utterancesRef.current.push(utterance);
        window.speechSynthesis.speak(utterance);
      };

      // Panggil langsung secara sinkron dengan interaksi user agar tidak diblokir browser
      speakNextChunk();
    }
  };

  const markdownStyles = "text-slate-700 leading-relaxed " +
    "[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-teal-900 [&>h1]:mb-6 [&>h1]:mt-8 " +
    "[&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-teal-800 [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:border-b [&>h2]:border-slate-200 [&>h2]:pb-2 " +
    "[&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-teal-700 [&>h3]:mb-3 [&>h3]:mt-5 " +
    "[&>p]:mb-4 [&>p]:text-justify " +
    "[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul>li]:mb-2 [&>ul>li]:pl-1 " +
    "[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol>li]:mb-2 [&>ol>li]:pl-1 " +
    "[&>strong]:font-bold [&>strong]:text-teal-900 " +
    "[&>blockquote]:border-l-4 [&>blockquote]:border-teal-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>blockquote]:mb-5 " +
    "[&_table]:w-full [&_table]:mb-6 [&_table]:border-collapse [&_table]:text-sm [&_table]:text-left [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:shadow-sm " +
    "[&_thead_tr]:bg-slate-100 " +
    "[&_th]:border [&_th]:border-slate-300 [&_th]:px-4 [&_th]:py-3 [&_th]:font-bold [&_th]:text-slate-700 " +
    "[&_td]:border [&_td]:border-slate-300 [&_td]:px-4 [&_td]:py-3 [&_tbody_tr:nth-child(even)]:bg-slate-50";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-teal-600" /> AI Financial Advisor
          </h2>
          <p className="text-slate-500 text-sm mt-1">Konsultan pribadi untuk menganalisa kesehatan keuangan Kamu</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('evaluate')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'evaluate' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Evaluasi
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'history' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Clock size={16} /> Riwayat
          </button>
        </div>
      </div>

      {viewMode === 'evaluate' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex-1 flex items-center gap-3 w-full">
              <Calendar className="text-slate-400 w-5 h-5 shrink-0" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full md:w-auto p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="hari_ini">Hari Ini</option>
                <option value="bulan_ini">Bulan Ini</option>
                <option value="tahun_ini">Tahun Ini</option>
                <option value="semua">Semua Waktu</option>
                <option value="custom">Custom Tanggal</option>
              </select>

              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in">
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={getFinancialAdvice}
                disabled={isEvaluating || isExporting}
                className={`${isEvaluating ? 'bg-teal-400 cursor-wait' : 'bg-teal-600 hover:bg-teal-700 shadow-md'} text-white px-5 py-2 rounded-lg font-bold flex items-center transition-all w-full md:w-auto justify-center`}
              >
                {isEvaluating ? (
                  <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Menganalisa...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Evaluasi</>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Chart Visualizations */}
              {chartData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chartData.pieData && chartData.pieData.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 text-center mb-4">Pengeluaran per Kategori</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                              {chartData.pieData.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {chartData.barData && chartData.barData.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 text-center mb-4">Pemasukan vs Pengeluaran</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.barData}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                              {chartData.barData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.name.toLowerCase() === 'pengeluaran' || entry.name.toLowerCase() === 'expense' ? '#ef4444' : '#10b981'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Main AI Response Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                <div className="bg-teal-50 border-b border-teal-100 px-6 py-4 flex items-center justify-between shrink-0">
                  <h3 className="font-bold text-teal-900 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-teal-600" /> Laporan Evaluasi & Insight
                  </h3>
                  {advice && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleSpeech}
                        className={`px-3 py-1.5 rounded-lg font-bold text-sm flex items-center transition-all shadow-sm ${isSpeaking ? 'bg-teal-600 text-white' : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-100'}`}
                      >
                        {isSpeaking ? (
                          <><Square className="w-4 h-4 mr-1.5 fill-current" /> Stop</>
                        ) : (
                          <><Volume2 className="w-4 h-4 mr-1.5" /> Dengar</>
                        )}
                      </button>
                      <button
                        onClick={exportToPdf}
                        disabled={isExporting}
                        className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-bold text-sm flex items-center shadow-sm"
                        title="Download PDF"
                      >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8 flex-grow overflow-y-auto">
                  {isEvaluating ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-teal-100 rounded-full animate-pulse"></div>
                        <Sparkles className="w-8 h-8 text-teal-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                      </div>
                      <p className="text-teal-700 font-medium">Membaca seluruh riwayat transaksi Kamu...</p>
                    </div>
                  ) : advice ? (
                    <div className={`max-w-none ${markdownStyles}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {advice}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <img src="https://illustrations.popsy.co/teal/surreal-hourglass.svg" alt="Advisor Empty" className="w-48 opacity-60 mb-6" />
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Belum ada laporan</h3>
                      <p className="text-slate-500 max-w-sm">Pilih rentang tanggal dan klik "Evaluasi" untuk mendapatkan analisa AI.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Evaluated Data Context */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 h-fit">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-500" /> Data yang Dievaluasi
              </h3>

              {!advice && !isEvaluating ? (
                <p className="text-sm text-slate-500 text-center py-8">Data akan muncul di sini setelah evaluasi dilakukan.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Status Saldo</h4>
                    <div className="space-y-2">
                      {evaluatedWallets.map(w => (
                        <div key={w.id} className="flex justify-between text-sm">
                          <span className="text-slate-600 truncate mr-2">{w.name}</span>
                          <span className="font-medium text-slate-800">{formatRupiah(w.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                        <span className="text-slate-800">Total Kekayaan</span>
                        <span className="text-teal-700">{formatRupiah(getTotalBalance(evaluatedWallets))}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">
                      Riwayat Transaksi Terkait ({evaluatedTransactions.length})
                    </h4>
                    {evaluatedTransactions.length === 0 ? (
                      <p className="text-xs text-slate-500">Tidak ada transaksi yang ter-load/ditampilkan</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {evaluatedTransactions.slice().reverse().map(tx => (
                          <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-start shadow-sm">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center space-x-1">
                                {tx.type === 'income' ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                <p className="text-xs font-bold text-slate-800 truncate">{tx.category}</p>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{new Date(tx.date).toLocaleDateString('id-ID')}</p>
                              {tx.note && <p className="text-[10px] text-slate-600 truncate mt-1 italic">"{tx.note}"</p>}
                            </div>
                            <div className={`text-xs font-bold shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Riwayat Evaluasi FINA</h3>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Belum ada riwayat evaluasi.</div>
          ) : (
            <div className="space-y-3">
              {historyList.map(h => (
                <button
                  key={h.id}
                  onClick={() => loadHistoryItem(h)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl transition-all text-left group"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-teal-800">Evaluasi: {h.dateRange.replace('_', ' ').toUpperCase()}</h4>
                    <p className="text-xs text-slate-500 mt-1">{new Date(h.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-teal-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden PDF Container */}
      <div className="absolute top-[-9999px] left-[-9999px] w-[800px] bg-white text-slate-800 p-8 z-[-1]" aria-hidden="true">
        <div ref={pdfContainerRef} className="bg-white font-sans text-slate-800 w-[800px] p-6 pb-20">
          <div className="border-b-2 border-teal-600 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-teal-800">Laporan Evaluasi AI Advisor</h1>
            <p className="text-slate-500 mt-1">Fina Advisor - {new Date().toLocaleDateString('id-ID')}</p>
          </div>

          <div className="mb-10">
            <div className={`max-w-none ${markdownStyles}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{advice}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
