import React, { useState } from 'react';
import { Wallet } from '@/types';
import { ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  wallets: Wallet[];
  onTransfer: (sourceWalletId: string, destWalletId: string, amount: number, date: string, note: string) => Promise<void>;
  onClose: () => void;
}

export default function TransferModal({ wallets, onTransfer, onClose }: TransferModalProps) {
  const [sourceWalletId, setSourceWalletId] = useState(wallets[0]?.id || '');
  const [destWalletId, setDestWalletId] = useState(wallets.length > 1 ? wallets[1].id : '');
  const [amount, setAmount] = useState<number | ''>('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWalletId || !destWalletId || !amount) {
      alert("Mohon lengkapi semua field yang wajib.");
      return;
    }
    if (sourceWalletId === destWalletId) {
      alert("Dompet asal dan tujuan tidak boleh sama.");
      return;
    }
    if (Number(amount) <= 0) {
      alert("Nominal harus lebih dari 0.");
      return;
    }

    const sourceWallet = wallets.find(w => w.id === sourceWalletId);
    if (sourceWallet && Number(amount) > sourceWallet.balance) {
      if (!window.confirm(`Saldo dompet ${sourceWallet.name} tidak mencukupi (Sisa: Rp ${sourceWallet.balance.toLocaleString()}). Tetap lanjutkan transfer?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onTransfer(sourceWalletId, destWalletId, Number(amount), new Date(dateStr).toISOString(), note);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat melakukan transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
          <div className="flex items-center text-teal-800">
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            <h3 className="font-bold text-lg">Transfer Antar Dompet</h3>
          </div>
          <button type="button" onClick={onClose} className="text-teal-600 hover:text-teal-800 font-bold">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dari Dompet</label>
              <select 
                value={sourceWalletId}
                onChange={e => setSourceWalletId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {wallets.map(w => (
                  <option key={`src-${w.id}`} value={w.id}>
                    {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ke Dompet</label>
              <select 
                value={destWalletId}
                onChange={e => setDestWalletId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="" disabled>Pilih Tujuan</option>
                {wallets.filter(w => w.id !== sourceWalletId).map(w => (
                  <option key={`dest-${w.id}`} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Transfer (Rp)</label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="0"
              min="1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-bold text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input 
              type="datetime-local" 
              required
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (Opsional)</label>
            <input 
              type="text" 
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Pindah dana tabungan"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50">Batal</button>
            <button type="submit" disabled={isSubmitting || !destWalletId || amount === '' || Number(amount) <= 0} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center">
              {isSubmitting ? 'Memproses...' : 'Transfer Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
