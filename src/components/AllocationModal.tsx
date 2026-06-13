import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Wallet as WalletIcon } from 'lucide-react';
import { AllocationProposal, Wallet, Allocation } from '@/types';

interface AllocationModalProps {
  proposal: AllocationProposal;
  wallets: Wallet[];
  onApprove: (allocations: Allocation[]) => void;
  onCancel: () => void;
}

export default function AllocationModal({ proposal, wallets, onApprove, onCancel }: AllocationModalProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  useEffect(() => {
    const allAllocs = wallets.map(w => {
      const aiAlloc = proposal.allocations.find(a => a.walletId === w.id || a.walletName?.toLowerCase() === w.name.toLowerCase());
      if (aiAlloc) {
        return {
          walletId: w.id,
          walletName: w.name,
          percentage: aiAlloc.percentage,
          amount: aiAlloc.amount
        };
      }
      return {
        walletId: w.id,
        walletName: w.name,
        percentage: 0,
        amount: 0
      };
    });
    
    allAllocs.sort((a, b) => {
       if (a.amount > 0 && b.amount === 0) return -1;
       if (a.amount === 0 && b.amount > 0) return 1;
       return a.walletName.localeCompare(b.walletName);
    });

    setAllocations(allAllocs);
  }, [proposal, wallets]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const updateAmount = (index: number, newAmount: number) => {
    const newAllocs = [...allocations];
    newAllocs[index].amount = newAmount;
    newAllocs[index].percentage = Math.round((newAmount / proposal.amount) * 100);
    setAllocations(newAllocs);
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remaining = proposal.amount - totalAllocated;
  const isOverAllocated = remaining < 0;

  return (
    <div className="fixed inset-0 bg-teal-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 my-8 flex flex-col max-h-[90vh]">
        <div className="bg-teal-50 px-6 py-6 text-center border-b border-teal-100 shrink-0">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-teal-600"/>
          </div>
          <h3 className="font-bold text-xl text-teal-900 mb-2">Pemasukan Terdeteksi!</h3>
          <p className="text-sm text-teal-700">
            AI mendeteksi pemasukan <strong className="text-teal-900">{formatRupiah(proposal.amount)}</strong>. Kamu bisa mengubah nominal alokasi di bawah ini:
          </p>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-3 mb-4">
            {allocations.map((alloc, idx) => (
              <div key={alloc.walletId} className={`flex flex-col p-3 border rounded-xl transition-colors ${alloc.amount > 0 ? 'bg-teal-50/50 border-teal-200' : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <WalletIcon className={`w-4 h-4 mr-2 ${alloc.amount > 0 ? 'text-teal-500' : 'text-slate-400'}`} />
                    <span className="font-medium text-slate-800 text-sm">
                      {alloc.walletName}
                    </span>
                  </div>
                  {alloc.amount > 0 && (
                    <div className="text-xs font-bold text-teal-600 bg-teal-100 px-2 py-1 rounded-full">
                      {alloc.percentage}%
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-medium">Rp</span>
                  <input 
                    type="number"
                    value={alloc.amount || ''}
                    onChange={(e) => updateAmount(idx, Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-800 transition-shadow"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={`p-4 rounded-xl border ${isOverAllocated ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-slate-600">Total Dialokasikan:</span>
              <span className="font-bold text-slate-800">{formatRupiah(totalAllocated)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className={isOverAllocated ? 'text-red-600' : 'text-slate-800'}>
                {isOverAllocated ? 'Kelebihan Alokasi:' : 'Sisa (Otomatis ke Daily):'}
              </span>
              <span className={isOverAllocated ? 'text-red-600' : 'text-teal-600'}>
                {formatRupiah(Math.abs(remaining))}
              </span>
            </div>
            {isOverAllocated && (
              <p className="text-xs text-red-500 mt-2">Total alokasi melebihi jumlah pemasukan. Silakan kurangi alokasi di beberapa dompet.</p>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-3 shrink-0">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            Batal
          </button>
          <button 
            onClick={() => onApprove(allocations.filter(a => a.amount > 0))}
            disabled={isOverAllocated}
            className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center ${isOverAllocated ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-500/30'}`}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Setujui
          </button>
        </div>
      </div>
    </div>
  );
}
