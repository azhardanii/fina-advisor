import React from 'react';
import { XCircle } from 'lucide-react';
import { Wallet } from '@/types';

interface WalletModalProps {
  editWalletId: string | null;
  newWallet: Partial<Wallet>;
  setNewWallet: (wallet: Partial<Wallet>) => void;
  activeAlgorithm: string;
  onSave: () => void;
  onClose: () => void;
}

const COLORS = [
  'bg-slate-400', 'bg-gray-400', 'bg-stone-400', 'bg-red-400', 'bg-orange-400', 
  'bg-amber-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 
  'bg-teal-400', 'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400', 
  'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400', 'bg-rose-400'
];

export default function WalletModal({ editWalletId, newWallet, setNewWallet, activeAlgorithm, onSave, onClose }: WalletModalProps) {
  
  const getAlgorithmGroups = (algo: string) => {
    switch(algo) {
      case '50-30-20':
        return [{id: 'needs', name: 'Needs / Pokok (50%)'}, {id: 'wants', name: 'Wants / Keinginan (30%)'}, {id: 'savings', name: 'Savings / Tabungan (20%)'}];
      case '60-20-20':
        return [{id: 'needs', name: 'Needs / Pokok (60%)'}, {id: 'wants', name: 'Wants / Keinginan (20%)'}, {id: 'savings', name: 'Savings / Tabungan (20%)'}];
      case 'flexible':
        return [{id: 'flexible', name: 'Flexible (Bisa Dipakai)'}, {id: 'freeze', name: 'Freeze (Dana Dibekukan)'}];
      case 'custom':
        return [{id: 'custom1', name: 'Custom Group 1'}, {id: 'custom2', name: 'Custom Group 2'}, {id: 'custom3', name: 'Custom Group 3'}];
      default:
        return [];
    }
  };

  const groups = getAlgorithmGroups(activeAlgorithm);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">{editWalletId ? 'Edit Wallet' : 'Buat Wallet Baru'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Wallet</label>
            <input 
              type="text" 
              value={newWallet.name || ''}
              onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Misal: Tabungan Liburan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Saldo {editWalletId ? 'Saat Ini' : 'Awal'}</label>
            <input 
              type="number" 
              value={newWallet.balance || 0}
              onChange={(e) => setNewWallet({...newWallet, balance: Number(e.target.value)})}
              disabled={!!editWalletId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none ${editWalletId ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
            />
            {editWalletId && (
              <p className="text-xs text-slate-500 mt-1">Saldo hanya bisa berubah berdasarkan histori transaksi.</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Informasi Rekening Nyata (Opsional)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nama Bank / E-Wallet</label>
                <input 
                  type="text" 
                  value={newWallet.bankName || ''}
                  onChange={(e) => setNewWallet({...newWallet, bankName: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Misal: BCA, Mandiri, GoPay"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nomor Rekening</label>
                  <input 
                    type="text" 
                    value={newWallet.accountNumber || ''}
                    onChange={(e) => setNewWallet({...newWallet, accountNumber: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Misal: 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Atas Nama</label>
                  <input 
                    type="text" 
                    value={newWallet.accountName || ''}
                    onChange={(e) => setNewWallet({...newWallet, accountName: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Misal: Budi"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">Grup Alokasi (Algoritma {activeAlgorithm})</label>
            {activeAlgorithm === 'custom' ? (
               <input 
                 type="text" 
                 value={newWallet.allocationGroup || ''}
                 onChange={(e) => setNewWallet({...newWallet, allocationGroup: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                 placeholder="Ketik nama grup custom..."
               />
            ) : (
              <select
                value={newWallet.allocationGroup || ''}
                onChange={(e) => setNewWallet({...newWallet, allocationGroup: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="">Pilih Grup / Uncategorized</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Warna</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button 
                  key={color}
                  onClick={() => setNewWallet({...newWallet, color})}
                  className={`w-8 h-8 rounded-full ${color} ${newWallet.color === color ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
                />
              ))}
            </div>
          </div>
          <button 
            onClick={onSave}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 rounded-lg mt-4"
          >
            Simpan Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
