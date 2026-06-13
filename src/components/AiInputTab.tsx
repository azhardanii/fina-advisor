import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Send, Activity, XCircle } from 'lucide-react';
import { Wallet, Transaction, AllocationProposal, Category } from '@/types';

interface AiInputTabProps {
  wallets: Wallet[];
  categories: Category[];
  onExecuteTransactions: (txs: Omit<Transaction, 'id'>[]) => void;
  onShowAllocationProposal: (proposal: AllocationProposal) => void;
  onShowReceipt: (txs: Omit<Transaction, 'id'>[]) => void;
}

export default function AiInputTab({ wallets, categories, onExecuteTransactions, onShowAllocationProposal, onShowReceipt }: AiInputTabProps) {
  const [aiInputText, setAiInputText] = useState('');
  const [aiInputImage, setAiInputImage] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiInputImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAiInput = async () => {
    if (!aiInputText && !aiInputImage) return;
    setIsAiLoading(true);

    try {
      const parts: any[] = [];
      
      const systemInstruction = `Kamu adalah AI Financial Advisor profesional bernama 'Gemini Finance'.
Tugas Kamu mengekstrak informasi keuangan dari teks atau gambar (struk belanja/mutasi).
Jawab HANYA dengan format JSON yang valid tanpa markdown \`\`\`json.
Daftar Wallet User saat ini: ${JSON.stringify(wallets.map(w => ({id: w.id, name: w.name})))}.
Daftar Kategori yang Tersedia: ${JSON.stringify(categories.map(c => c.name))}.

Skema JSON yang WAJIB dikembalikan:
{
  "transactions": [
    {
      "type": "income" | "expense",
      "amount": number,
      "category": string (PENTING: Kamu HANYA BOLEH menggunakan nama kategori yang persis sama dari Daftar Kategori yang Tersedia. DILARANG KERAS membuat nama kategori sendiri. Jika bingung, pilih yang paling mendekati.),
      "note": string (deskripsi singkat),
      "suggestAllocation": boolean (TRUE jika type adalah 'income', FALSE jika 'expense'),
      "allocations": [
        {
          "walletName": string (PENTING: Harus sama persis dengan Daftar Wallet),
          "percentage": number (0-100)
        }
      ]
    }
  ]
}`;

      let promptText = "Analisis transaksi berikut: " + aiInputText;
      if (aiInputImage) promptText += " [Lampiran Gambar Struk/Bukti Transaksi]. Jika gambar berupa struk, totalkan pengeluarannya.";
      parts.push({ text: promptText });

      if (aiInputImage && aiImagePreview) {
        const base64Data = aiImagePreview.split(',')[1];
        parts.push({
          inlineData: {
            mimeType: aiInputImage.type,
            data: base64Data
          }
        });
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: parts }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { 
            responseMimeType: "application/json"
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghubungi API");
      }

      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("Gagal membaca respon AI");

      const parsedData = JSON.parse(resultText);

      if (!parsedData.transactions || !Array.isArray(parsedData.transactions)) {
        if (parsedData.type) {
          parsedData.transactions = [parsedData];
        } else {
          throw new Error("Format JSON tidak sesuai skema (array transactions tidak ditemukan).");
        }
      }

      const defaultWallet = wallets.find(w => w.name.toLowerCase().includes('daily')) || wallets[0];

      const allocationTx = parsedData.transactions.find((t: any) => t.suggestAllocation);

      if (allocationTx && allocationTx.allocations?.length > 0) {
        const otherTxs = parsedData.transactions.filter((t: any) => t !== allocationTx);

        const mappedAllocations = allocationTx.allocations.map((alloc: any) => {
          const w = wallets.find(w => w.name.toLowerCase() === alloc.walletName.toLowerCase());
          return {
            walletId: w ? w.id : defaultWallet.id,
            walletName: w ? w.name : alloc.walletName,
            percentage: alloc.percentage,
            amount: Math.round((alloc.percentage / 100) * allocationTx.amount)
          };
        });

        onShowAllocationProposal({
          type: allocationTx.type,
          amount: allocationTx.amount,
          category: allocationTx.category,
          note: allocationTx.note,
          suggestAllocation: true,
          allocations: mappedAllocations,
          originalInput: aiInputText
        });

        if (otherTxs.length > 0) {
          const executedTxs = otherTxs.map((t: any) => ({
            type: t.type,
            amount: t.amount,
            category: t.category,
            note: t.note,
            walletId: defaultWallet?.id,
            date: new Date().toISOString()
          }));
          onExecuteTransactions(executedTxs);
          onShowReceipt(executedTxs);
        }
      } else {
        const executedTxs = parsedData.transactions.map((t: any) => ({
          type: t.type,
          amount: t.amount,
          category: t.category,
          note: t.note,
          walletId: defaultWallet?.id,
          date: new Date().toISOString()
        }));
        onExecuteTransactions(executedTxs);
        onShowReceipt(executedTxs);
      }

      setAiInputText('');
      setAiInputImage(null);
      setAiImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      console.error("AI Processing Error:", error);
      let errorMsg = 'Gagal terhubung ke server AI.';
      
      if (error.message) {
        if (error.message.includes('503') || error.message.includes('high demand') || error.message.includes('UNAVAILABLE')) {
          errorMsg = 'Server AI saat ini sedang sibuk (High Demand). Silakan coba lagi dalam beberapa saat.';
        } else {
          errorMsg = error.message;
        }
      }
      
      alert(`Maaf, terjadi kesalahan: ${errorMsg}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl shadow-xl border border-teal-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-teal-100"/>
          <h2 className="text-2xl font-bold mb-2">Asisten Pencatatan Cerdas</h2>
          <p className="text-teal-50 text-sm">Ceritakan pengeluaran/pemasukan Kamu atau unggah foto struk. AI akan memprosesnya otomatis.</p>
          <p className="text-teal-100 text-xs mt-2 bg-black/10 inline-block px-3 py-1 rounded-full">Tips: Ketik "Gajian bulan ini 10 juta" untuk melihat auto-alokasi!</p>
        </div>

        <div className="p-6 space-y-4">
          {aiImagePreview && (
            <div className="relative inline-block">
              <img src={aiImagePreview} alt="Struk" className="h-32 rounded-lg border border-slate-200 object-cover shadow-sm" />
              <button 
                onClick={() => { setAiInputImage(null); setAiImagePreview(''); if(fileInputRef.current) fileInputRef.current.value=''; }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative">
            <textarea 
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder="Contoh: Beli bensin motor 30rb, ngopi 25rb... atau upload struk/mutasi berupa gambar."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none min-h-[120px]"
            />
            <div className="absolute bottom-3 right-3 flex space-x-2">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white text-slate-400 hover:text-teal-600 rounded-full shadow-sm border border-slate-200 transition-colors"
                title="Upload Struk / Gambar"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button 
            onClick={processAiInput}
            disabled={isAiLoading || (!aiInputText && !aiInputImage)}
            className={`w-full py-4 rounded-xl font-bold flex justify-center items-center transition-all ${isAiLoading || (!aiInputText && !aiInputImage) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-teal-500/30'}`}
          >
            {isAiLoading ? (
              <span className="flex items-center"><Activity className="w-5 h-5 mr-2 animate-spin"/> Memproses dengan AI...</span>
            ) : (
              <span className="flex items-center"><Send className="w-5 h-5 mr-2"/> Analisis & Catat</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
