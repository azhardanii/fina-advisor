import React from 'react';
import { XCircle, TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { Wallet, Transaction } from '@/types';

interface WalletDetailModalProps {
  wallet: Wallet;
  transactions: Transaction[];
  formatRupiah: (number: number) => string;
  onClose: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export default function WalletDetailModal({ wallet, transactions, formatRupiah, onClose, onEditTransaction, onDeleteTransaction }: WalletDetailModalProps) {
  const isEditable = (dateStr: string) => {
    return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
  };

  // Filter and sort transactions for this specific wallet
  const walletTransactions = transactions
    .filter(tx => tx.walletId === wallet.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className={`px-6 py-8 text-white relative ${wallet.color}`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <XCircle className="w-6 h-6"/>
          </button>
          <div className="flex justify-between items-end">
            <div>
              <h3 className="font-bold text-3xl mb-1">{wallet.name}</h3>
              <p className="text-white/80 font-medium text-lg">{formatRupiah(wallet.balance)}</p>

              {(wallet.bankName || wallet.accountNumber || wallet.accountName) && (
                <div className="mt-4 text-sm text-white/90 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                  {wallet.bankName && <p className="mb-0.5"><span className="opacity-70 inline-block w-24">Bank/E-Wallet</span> : <strong className="ml-1 tracking-wide">{wallet.bankName}</strong></p>}
                  {wallet.accountNumber && <p className="mb-0.5"><span className="opacity-70 inline-block w-24">No. Rekening</span> : <strong className="ml-1 tracking-wider">{wallet.accountNumber}</strong></p>}
                  {wallet.accountName && <p><span className="opacity-70 inline-block w-24">Atas Nama</span> : <strong className="ml-1">{wallet.accountName}</strong></p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Riwayat Transaksi</h4>
          
          {walletTransactions.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada transaksi di dompet ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'income' ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{tx.category}</p>
                      <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {tx.note && <p className="text-xs text-slate-500 mt-1">{tx.note}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </div>
                    {isEditable(tx.date) && onEditTransaction && onDeleteTransaction && (
                      <div className="flex space-x-2 mt-1">
                        <button onClick={() => { onEditTransaction(tx); onClose(); }} className="text-slate-400 hover:text-teal-600 p-1">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDeleteTransaction(tx.id)} className="text-slate-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
