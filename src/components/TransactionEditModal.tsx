import React, { useState, useEffect } from 'react';
import { Transaction, Wallet, Category } from '@/types';

interface TransactionEditModalProps {
  transaction: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  onSave: (tx: Transaction) => void;
  onClose: () => void;
}

export default function TransactionEditModal({ transaction, wallets, categories, onSave, onClose }: TransactionEditModalProps) {
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setCategory(transaction.category);
      setNote(transaction.note);
      setWalletId(transaction.walletId);
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transaction) {
      onSave({ ...transaction, amount, category, note, walletId });
    }
  };

  if (!transaction) return null;

  const typeLabel = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Edit {typeLabel}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nominal</label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {categories.filter(c => c.type === transaction.type).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              {/* Fallback in case old category doesn't exist */}
              {!categories.find(c => c.name === category) && (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dompet (Wallet)</label>
            <select 
              value={walletId}
              onChange={e => setWalletId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <input 
              type="text" 
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Batal</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
