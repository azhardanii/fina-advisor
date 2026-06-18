import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, Trash2, Edit2, Sparkles, Pin } from 'lucide-react';
import { Wallet, Transaction, CustomAlgorithmGroup } from '@/types';
import WalletDetailModal from './WalletDetailModal';

import { getIconTheme } from '@/lib/theme';

interface WalletsTabProps {
  wallets: Wallet[];
  transactions: Transaction[];
  formatRupiah: (number: number) => string;
  onOpenEditWallet: (wallet: Wallet | null) => void;
  onDeleteWallet: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onTogglePinWallet: (wallet: Wallet) => void;
  onOpenTransferModal: () => void;
  activeAlgorithm: string;
  setActiveAlgorithm: (algo: any) => void;
  onUpdateWallets: (wallets: Wallet[]) => void;
  customAlgorithmGroups: CustomAlgorithmGroup[];
  setCustomAlgorithmGroups: (groups: CustomAlgorithmGroup[]) => void;
}

export default function WalletsTab({ 
  wallets, transactions, formatRupiah, onOpenEditWallet, onDeleteWallet, onEditTransaction, onDeleteTransaction, onTogglePinWallet, onOpenTransferModal,
  activeAlgorithm, setActiveAlgorithm, onUpdateWallets, customAlgorithmGroups, setCustomAlgorithmGroups
}: WalletsTabProps) {
  const [detailWallet, setDetailWallet] = useState<Wallet | null>(null);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [customRows, setCustomRows] = useState<CustomAlgorithmGroup[]>(
    customAlgorithmGroups.length > 0 
      ? customAlgorithmGroups 
      : [{ id: `group-${Date.now()}`, name: '', percentage: 0 }]
  );

  useEffect(() => {
    if (customAlgorithmGroups.length > 0) {
      setCustomRows(customAlgorithmGroups);
    }
  }, [customAlgorithmGroups]);

  const getAlgorithmGroups = (algo: string) => {
    switch(algo) {
      case '50-30-20':
        return [{id: 'needs', name: 'Needs / Pokok (50%)'}, {id: 'wants', name: 'Wants / Keinginan (30%)'}, {id: 'savings', name: 'Savings / Tabungan (20%)'}];
      case '60-20-20':
        return [{id: 'needs', name: 'Needs / Pokok (60%)'}, {id: 'wants', name: 'Wants / Keinginan (20%)'}, {id: 'savings', name: 'Savings / Tabungan (20%)'}];
      case 'flexible':
        return [{id: 'flexible', name: 'Flexible (Bisa Dipakai)'}, {id: 'freeze', name: 'Freeze (Dana Dibekukan)'}];
      case 'custom':
        return customAlgorithmGroups.map(g => ({id: g.id, name: `${g.name} (${g.percentage}%)`}));
      default:
        return [];
    }
  };

  const groups = getAlgorithmGroups(activeAlgorithm);
  // Group wallets
  const groupedWallets = groups.map(g => {
    return {
      group: g,
      wallets: wallets.filter(w => w.allocationGroup === g.id)
    };
  });
  
  const uncategorizedWallets = wallets.filter(w => !groups.find(g => g.id === w.allocationGroup));

  const triggerAiCategorization = async (algo: string, customGroupsConfig?: CustomAlgorithmGroup[]) => {
    if (wallets.length === 0) return;
    
    setIsAiCategorizing(true);
    try {
      let targetGroups;
      if (algo === 'custom' && customGroupsConfig) {
        targetGroups = customGroupsConfig.map(g => ({ id: g.id, name: `${g.name} (${g.percentage}%)` }));
      } else {
        targetGroups = getAlgorithmGroups(algo).map(g => ({ id: g.id, name: g.name }));
      }
      const walletList = wallets.map(w => ({ id: w.id, name: w.name, currentGroup: w.allocationGroup }));
      
      const prompt = `You are a financial advisor. I have these wallets:
${JSON.stringify(walletList, null, 2)}

I want to categorize them into one of these exact groups:
${JSON.stringify(targetGroups, null, 2)}

Return ONLY a JSON response in this exact format:
{ "mappings": [ { "walletId": "string", "groupId": "string" } ] }`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResponse) {
        const parsed = JSON.parse(textResponse);
        if (parsed.mappings && Array.isArray(parsed.mappings)) {
          const newWallets = wallets.map(w => {
            const mapping = parsed.mappings.find((m: any) => m.walletId === w.id);
            if (mapping && targetGroups.some(g => g.id === mapping.groupId)) {
              return { ...w, allocationGroup: mapping.groupId };
            }
            return { ...w, allocationGroup: '' };
          });
          onUpdateWallets(newWallets);
        }
      }
    } catch (error) {
      console.error('Failed to auto-categorize:', error);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const handleAlgorithmChange = async (algo: string) => {
    setActiveAlgorithm(algo);
    if (algo === 'custom' || wallets.length === 0) return;
    await triggerAiCategorization(algo);
  };

  const handleAddCustomRow = () => {
    setCustomRows([...customRows, { id: `group-${Date.now()}`, name: '', percentage: 0 }]);
  };

  const handleUpdateCustomRow = (index: number, field: keyof CustomAlgorithmGroup, value: string | number) => {
    const newRows = [...customRows];
    newRows[index] = { ...newRows[index], [field]: value as never };
    setCustomRows(newRows);
  };

  const handleRemoveCustomRow = (index: number) => {
    const newRows = [...customRows];
    newRows.splice(index, 1);
    setCustomRows(newRows);
  };

  const totalCustomPercentage = customRows.reduce((sum, r) => sum + Number(r.percentage || 0), 0);

  const handleSaveCustomAlgo = () => {
    if (totalCustomPercentage !== 100) return;
    setCustomAlgorithmGroups(customRows);
    triggerAiCategorization('custom', customRows);
  };

  const handleDragStart = (e: React.DragEvent, walletId: string) => {
    e.dataTransfer.setData('walletId', walletId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    const walletId = e.dataTransfer.getData('walletId');
    if (!walletId) return;

    const newWallets = wallets.map(w => 
      w.id === walletId ? { ...w, allocationGroup: targetGroupId } : w
    );
    onUpdateWallets(newWallets);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Manajemen Dompet</h2>
        <div className="flex w-full sm:w-auto gap-2">
          {wallets.length >= 2 && (
            <button 
              onClick={onOpenTransferModal}
              className="flex-1 sm:flex-none justify-center bg-slate-100 hover:bg-slate-200 text-teal-700 border border-teal-100 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
            >
              Transfer
            </button>
          )}
          <button 
            onClick={() => onOpenEditWallet(null)}
            className="flex-1 sm:flex-none justify-center bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2"/> Buat Dompet
          </button>
        </div>
      </div>

      {wallets.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-800">Algoritma Alokasi</h3>
            <p className="text-sm text-slate-500">Tentukan bagaimana dompet Kamu dikelompokkan</p>
          </div>
          <select 
            value={activeAlgorithm}
            onChange={(e) => handleAlgorithmChange(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="50-30-20">50/30/20 Rule</option>
            <option value="60-20-20">60/20/20 Rule</option>
            <option value="flexible">Flexible / Freeze</option>
            <option value="custom">Custom Grouping</option>
          </select>
        </div>
      )}

      {wallets.length > 0 && activeAlgorithm === 'custom' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Pengaturan Custom Grouping</h3>
          <div className="space-y-3 mb-4">
            {customRows.map((row, idx) => (
              <div key={row.id} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                <div className="flex-1 min-w-0">
                  <input 
                    type="text" 
                    placeholder="Nama Grup (Misal: Dana Liburan)" 
                    value={row.name}
                    onChange={(e) => handleUpdateCustomRow(idx, 'name', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 sm:w-auto">
                  <div className="flex-1 sm:w-24 relative">
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={row.percentage || ''}
                      onChange={(e) => handleUpdateCustomRow(idx, 'percentage', Number(e.target.value))}
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none pr-8"
                    />
                    <span className="absolute right-3 top-2.5 sm:top-2 text-sm text-slate-500">%</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveCustomRow(idx)}
                    className="p-2.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 sm:border-transparent shrink-0"
                    disabled={customRows.length <= 1}
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 sm:pt-3 border-t border-slate-200">
            <button 
              onClick={handleAddCustomRow}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center justify-center sm:justify-start bg-teal-50 px-3 py-2 sm:py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1"/> Tambah Grup
            </button>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <span className={`text-sm font-bold ${totalCustomPercentage === 100 ? 'text-teal-600' : 'text-red-500'}`}>
                Total: {totalCustomPercentage}%
              </span>
              <button 
                onClick={handleSaveCustomAlgo}
                disabled={totalCustomPercentage !== 100}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap ${totalCustomPercentage === 100 ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              >
                Simpan & Auto-Group
              </button>
            </div>
          </div>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm mt-8">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <WalletIcon className="w-10 h-10 text-teal-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Dompet</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Dompet berfungsi sebagai tempat penyimpanan uang Kamu. Buat dompet pertama Kamu agar bisa mulai mengatur alokasi keuangan!
          </p>
          <button 
            onClick={() => onOpenEditWallet(null)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/30"
          >
            Buat Dompet Pertama
          </button>
        </div>
      ) : isAiCategorizing ? (
        <div className="flex flex-col items-center justify-center p-12 bg-teal-50/50 rounded-2xl border border-teal-100 animate-pulse">
          <Sparkles className="w-10 h-10 text-teal-600 mb-4 animate-spin"/>
          <h3 className="text-teal-900 font-bold text-lg mb-1">AI Sedang Bekerja...</h3>
          <p className="text-teal-700 text-sm">Menyusun ulang dompet Kamu ke dalam grup algoritma baru.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedWallets.map(({group, wallets: gWallets}) => (
            <div 
              key={group.id} 
              className={`space-y-3 p-4 rounded-2xl border transition-colors min-h-[120px] ${gWallets.length === 0 ? 'bg-slate-50/30 border-dashed border-slate-200' : 'bg-slate-50/80 border-slate-100'}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, group.id)}
            >
              <h3 className="font-bold text-lg text-slate-800 border-b border-slate-200 pb-2">{group.name}</h3>
              {gWallets.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400 font-medium">Kosong. Tarik dompet ke sini.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gWallets.map(wallet => (
                    <WalletCard 
                      key={wallet.id} wallet={wallet} 
                      onClick={() => setDetailWallet(wallet)}
                      onEdit={() => onOpenEditWallet(wallet)}
                      onDelete={() => onDeleteWallet(wallet.id)}
                      onTogglePin={() => onTogglePinWallet(wallet)}
                      formatRupiah={formatRupiah}
                      onDragStart={(e) => handleDragStart(e, wallet.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {uncategorizedWallets.length > 0 && (
            <div 
              className="space-y-3 p-4 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200 min-h-[120px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, '')}
            >
              <h3 className="font-bold text-lg text-slate-500 border-b border-slate-200 pb-2">Uncategorized / Belum Dikelompokkan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uncategorizedWallets.map(wallet => (
                  <WalletCard 
                    key={wallet.id} wallet={wallet} 
                    onClick={() => setDetailWallet(wallet)}
                    onEdit={() => onOpenEditWallet(wallet)}
                    onDelete={() => onDeleteWallet(wallet.id)}
                    onTogglePin={() => onTogglePinWallet(wallet)}
                    formatRupiah={formatRupiah}
                    onDragStart={(e) => handleDragStart(e, wallet.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {detailWallet && (
        <WalletDetailModal 
          wallet={detailWallet}
          transactions={transactions}
          formatRupiah={formatRupiah}
          onClose={() => setDetailWallet(null)}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onDeleteTransaction}
        />
      )}
    </div>
  );
}

function WalletCard({ wallet, onClick, onEdit, onDelete, onTogglePin, formatRupiah, onDragStart }: { wallet: Wallet, onClick: () => void, onEdit: () => void, onDelete: () => void, onTogglePin: () => void, formatRupiah: (n: number) => string, onDragStart?: (e: React.DragEvent) => void }) {
  return (
    <div 
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`bg-white hover:shadow-md transition-shadow rounded-2xl shadow-sm border border-slate-200 p-5 relative overflow-hidden group flex flex-col ${onDragStart ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${wallet.color}`}></div>
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0 ${getIconTheme(wallet.color)}`}>
            <WalletIcon className="w-4 h-4"/>
          </div>
          <h3 className="font-bold text-lg text-slate-800 truncate" title={wallet.name}>{wallet.name}</h3>
        </div>
        <div className="flex space-x-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }} 
            className={`p-1.5 rounded-md ${wallet.isPinned ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
            title="Pin Dompet"
          >
            <Pin className="w-4 h-4" fill={wallet.isPinned ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="p-1.5 text-slate-400 hover:text-teal-600 rounded-md hover:bg-teal-50"
            title="Edit Dompet"
          >
            <Edit2 className="w-4 h-4"/>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
            title="Hapus Dompet"
          >
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>
      </div>
      {(wallet.bankName || wallet.accountNumber) && (
        <div className="text-xs text-slate-500 mb-2 truncate">
          {wallet.bankName} {wallet.accountNumber ? `• ${wallet.accountNumber}` : ''}
        </div>
      )}
      <p className="text-sm text-slate-500 mb-1">Saldo Saat Ini</p>
      <p className="text-2xl font-bold text-slate-800">{formatRupiah(wallet.balance)}</p>
    </div>
  );
}
