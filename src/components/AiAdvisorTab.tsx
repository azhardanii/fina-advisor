import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, FileText, TrendingUp, TrendingDown, RefreshCcw, Loader2, Volume2, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Wallet, Transaction } from '@/types';

interface AiAdvisorTabProps {
  wallets: Wallet[];
  transactions: Transaction[];
  formatRupiah: (number: number) => string;
}

export default function AiAdvisorTab({ wallets, transactions, formatRupiah }: AiAdvisorTabProps) {
  const [advice, setAdvice] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  
  const [evaluatedTransactions, setEvaluatedTransactions] = useState<Transaction[]>([]);
  const [evaluatedWallets, setEvaluatedWallets] = useState<Wallet[]>([]);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs to fix Chrome TTS bugs (garbage collection & stale state)
  const isSpeakingRef = useRef<boolean>(false);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getTotalBalance = (wals: Wallet[]) => wals.reduce((sum, w) => sum + w.balance, 0);

  const getFinancialAdvice = async () => {
    setIsEvaluating(true);
    setEvaluatedTransactions(transactions);
    setEvaluatedWallets(wallets);
    
    // Stop speaking if currently speaking
    if (isSpeaking && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
    
    try {
      const prompt = `Kamu adalah Financial Advisor Pribadi kelas dunia.
Tugas Kamu adalah mengevaluasi kondisi keuangan user berdasarkan data berikut.

Data Dompet Saat Ini:
${JSON.stringify(wallets, null, 2)}
Total Saldo Aktif: ${getTotalBalance(wallets)}

Riwayat Transaksi Keseluruhan:
${JSON.stringify(transactions, null, 2)}

Berikan evaluasi mendalam, insight, peringatan (jika ada pola pengeluaran buruk), dan rekomendasi tindakan konkrit (actionable advice).
FORMAT RESPON:
- Gunakan bahasa Indonesia yang ramah, profesional, *engaging*, dan memotivasi.
- Wajib gunakan Markdown: Gunakan header (##, ###), teks **bold** untuk poin penting, *italic*, bullet points (-), dan tabel jika diperlukan.
- Gunakan emoji yang relevan secukupnya agar tidak kaku, tapi jangan berlebihan.
- Buat responnya mudah dibaca dan di-scan oleh mata (scannable).
- Jangan berikan balasan dalam format JSON, berikan langsung tulisan artikel markdown yang rapi.`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-pro',
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setAdvice(data.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mendapatkan evaluasi.");
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
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = pdfContainerRef.current;
      const opt = {
        margin:       15,
        filename:     "Laporan_AI_Advisor_" + new Date().toISOString().split('T')[0] + ".pdf",
        image:        { type: 'jpeg' as 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
      };

      // Ensure the container is temporarily visible for rendering if it was display: none
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Gagal mengekspor PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Browser Kamu tidak mendukung fitur pemutar suara (Text-to-Speech).");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    } else {
      if (!advice) return;
      
      window.speechSynthesis.cancel(); // Reset any pending utterances
      
      // Strip markdown characters to make speech cleaner
      const plainText = advice.replace(/[*#_\`\\[\\]()]/g, '');
      
      // Sangat aman: pecah berdasarkan titik, tanda tanya, seru, atau baris baru
      const sentences = plainText.split(/[.!?\\n]+/).map(s => s.trim()).filter(s => s.length > 0);
      
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      utterancesRef.current = [];

      let currentIndex = 0;
      
      const speakNextChunk = () => {
        if (!isSpeakingRef.current) return;
        if (currentIndex >= sentences.length) {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          return;
        }

        const chunk = sentences[currentIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        
        // Try to find Indonesian voice if available
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID');
        if (idVoice) utterance.voice = idVoice;
        else utterance.lang = 'id-ID';

        utterance.rate = 1.0;
        
        utterance.onend = () => {
          currentIndex++;
          speakNextChunk();
        };
        
        utterance.onerror = (e) => {
          console.error("Speech error:", e);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        };

        utterancesRef.current.push(utterance); // Keep ref to prevent Garbage Collection bug in Chrome
        
        // Beri jeda sangat kecil agar cancel() dari baris atas tidak bertabrakan dengan speak()
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 50);
      };

      // Beri jeda awal untuk memberikan browser waktu load voices & reset memory
      setTimeout(() => {
        speakNextChunk();
      }, 100);
    }
  };

  // Custom Markdown Styles ensuring perfect spacing, typography, and TABLE styling
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
            <Sparkles className="w-6 h-6 mr-2 text-teal-600"/> AI Financial Advisor
          </h2>
          <p className="text-slate-500 text-sm mt-1">Konsultan pribadi untuk menganalisa kesehatan keuangan Kamu</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {advice && (
            <>
              <button 
                onClick={toggleSpeech}
                className={`border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center transition-all shadow-sm ${isSpeaking ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white hover:bg-slate-50'}`}
              >
                {isSpeaking ? (
                  <><Square className="w-4 h-4 mr-2 text-teal-600 fill-teal-600"/> Hentikan Suara</>
                ) : (
                  <><Volume2 className="w-4 h-4 mr-2"/> Dengarkan</>
                )}
              </button>

              <button 
                onClick={exportToPdf}
                disabled={isExporting}
                className={`bg-white border border-slate-300 text-slate-700 ${isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-slate-50'} px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm`}
              >
                {isExporting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Membuat PDF...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2"/> Export (.pdf)</>
                )}
              </button>
            </>
          )}
          <button 
            onClick={getFinancialAdvice}
            disabled={isEvaluating || isExporting}
            className={`${isEvaluating ? 'bg-teal-400 cursor-wait' : 'bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-teal-500/30'} text-white px-5 py-2 rounded-lg font-bold flex items-center transition-all`}
          >
            {isEvaluating ? (
              <><RefreshCcw className="w-4 h-4 mr-2 animate-spin"/> Menganalisa...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2"/> {advice ? 'Evaluasi Ulang' : 'Mulai Evaluasi'}</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main AI Response Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="bg-teal-50 border-b border-teal-100 px-6 py-4 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-teal-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-teal-600"/> Laporan Evaluasi & Insight
            </h3>
            {isSpeaking && (
              <div className="flex space-x-1">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-6 bg-teal-500 rounded-full animate-pulse delay-75"></span>
                <span className="w-1.5 h-3 bg-teal-500 rounded-full animate-pulse delay-150"></span>
                <span className="w-1.5 h-5 bg-teal-500 rounded-full animate-pulse delay-300"></span>
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
                <p className="text-slate-500 max-w-sm">Klik tombol "Mulai Evaluasi" di atas untuk mendapatkan analisa menyeluruh terkait kebiasaan finansial Kamu.</p>
              </div>
            )}
          </div>
        </div>

        {/* Evaluated Data Context */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 h-fit">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-slate-500"/> Data yang Dievaluasi
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
                  Riwayat Transaksi ({evaluatedTransactions.length})
                </h4>
                {evaluatedTransactions.length === 0 ? (
                  <p className="text-xs text-slate-500">Tidak ada transaksi</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {evaluatedTransactions.slice().reverse().map(tx => (
                      <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-start shadow-sm">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center space-x-1">
                            {tx.type === 'income' ? <TrendingUp className="w-3 h-3 text-green-500"/> : <TrendingDown className="w-3 h-3 text-red-500"/>}
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

      {/* Hidden PDF Container */}
      <div className="absolute top-[-9999px] left-[-9999px] w-[800px] bg-white text-slate-800 p-8 z-[-1]" aria-hidden="true">
        <div ref={pdfContainerRef} className="bg-white font-sans text-slate-800 w-[800px] p-6 pb-20">
          <div className="border-b-2 border-teal-600 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-teal-800">Laporan Evaluasi AI Advisor</h1>
            <p className="text-slate-500 mt-1">Fina Advisor - {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div className="mb-10">
            <div className={`max-w-none ${markdownStyles}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {advice}
              </ReactMarkdown>
            </div>
          </div>
          
          <div className="pt-6 border-t-2 border-slate-200" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Lampiran: Data yang Dievaluasi</h2>
            
            <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Status Saldo Dompet</h3>
              <div className="space-y-3">
                {evaluatedWallets.map(w => (
                  <div key={w.id} className="flex justify-between text-base">
                    <span className="text-slate-700">{w.name}</span>
                    <span className="font-semibold">{formatRupiah(w.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-bold pt-4 border-t border-slate-300 mt-4">
                  <span>Total Kekayaan Aktif</span>
                  <span className="text-teal-700">{formatRupiah(getTotalBalance(evaluatedWallets))}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Riwayat Transaksi</h3>
              {evaluatedTransactions.length === 0 ? (
                <p className="text-slate-500 italic">Tidak ada transaksi yang tercatat.</p>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="p-3 font-semibold text-slate-700">Tanggal</th>
                      <th className="p-3 font-semibold text-slate-700">Tipe</th>
                      <th className="p-3 font-semibold text-slate-700">Kategori</th>
                      <th className="p-3 font-semibold text-slate-700">Nominal</th>
                      <th className="p-3 font-semibold text-slate-700">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedTransactions.slice().reverse().map((tx, idx) => (
                      <tr key={tx.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="p-3 whitespace-nowrap">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{tx.category}</td>
                        <td className={`p-3 font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                        </td>
                        <td className="p-3 text-slate-600 italic text-xs max-w-[200px] truncate">{tx.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
