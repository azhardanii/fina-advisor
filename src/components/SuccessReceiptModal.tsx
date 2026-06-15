import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Transaction, Wallet } from '@/types';

interface SuccessReceiptModalProps {
  transactions: Omit<Transaction, 'id'>[] | null;
  wallets: Wallet[];
  formatRupiah: (number: number) => string;
  onClose: () => void;
}

export default function SuccessReceiptModal({ transactions, wallets, formatRupiah, onClose }: SuccessReceiptModalProps) {
  if (!transactions || transactions.length === 0) return null;

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="bg-teal-600 p-6 text-center text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="w-5 h-5"/>
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-bold text-xl">{transactions.length > 1 ? 'Transaksi Massal Berhasil!' : 'Transaksi Berhasil!'}</h3>
          <p className="text-teal-100 text-sm">Telah disimpan ke sistem</p>
        </div>
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
            {transactions.map((tx, index) => {
              const walletName = wallets.find(w => w.id === tx.walletId)?.name || 'Wallet';
              return (
                <div key={index} className={index !== transactions.length - 1 ? 'pb-4 border-b border-dashed border-slate-200' : ''}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-800 font-bold">{tx.category}</span>
                    <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-slate-500">Tanggal</span>
                    <span className="text-slate-600 font-medium">
                      {new Date(tx.date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-slate-500">Dompet</span>
                    <span className="text-slate-600 font-medium">{walletName}</span>
                  </div>
                  {tx.note && (
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-slate-500">Catatan</span>
                      <span className="text-slate-600 text-right max-w-[60%] italic">{tx.note}</span>
                    </div>
                  )}
                </div>
              );
            })}
            
            {transactions.length > 1 && (
              <div className="pt-3 mt-1 border-t-2 border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-bold text-lg text-slate-800">{formatRupiah(totalAmount)}</span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-full mt-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg hover:shadow-teal-500/30 transition-all shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
