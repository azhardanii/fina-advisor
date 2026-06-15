"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Wallet as WalletIcon, Tags, Sparkles, MessageSquarePlus, Menu, X, Activity } from 'lucide-react';
import { Wallet, Transaction, AllocationProposal, Allocation, Category, AllocationAlgorithm, CustomAlgorithmGroup } from '@/types';
import DashboardTab from '@/components/DashboardTab';
import WalletsTab from '@/components/WalletsTab';
import CategoriesTab from '@/components/CategoriesTab';
import AiInputTab from '@/components/AiInputTab';
import AiAdvisorTab from '@/components/AiAdvisorTab';
import WalletModal from '@/components/WalletModal';
import AllocationModal from '@/components/AllocationModal';
import SuccessReceiptModal from '@/components/SuccessReceiptModal';
import TransactionEditModal from '@/components/TransactionEditModal';
import TransferModal from '@/components/TransferModal';

type TabType = 'dashboard' | 'wallets' | 'categories' | 'ai-input' | 'ai-advisor';

const NAV_ITEMS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'wallets', label: 'Wallets', icon: WalletIcon },
  { id: 'ai-input', label: 'Input AI', icon: MessageSquarePlus },
  { id: 'categories', label: 'Kategori', icon: Tags },
  { id: 'ai-advisor', label: 'Advisor', icon: Sparkles },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeAlgorithm, setActiveAlgorithm] = useState<AllocationAlgorithm>('50-30-20');
  const [customAlgorithmGroups, setCustomAlgorithmGroups] = useState<CustomAlgorithmGroup[]>([]);
  
  const [allocationProposal, setAllocationProposal] = useState<AllocationProposal | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editWalletId, setEditWalletId] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState<Partial<Wallet>>({ name: '', balance: 0, color: 'bg-teal-500', bankName: '', accountNumber: '', accountName: '', allocationGroup: '' });
  const [receiptTransactions, setReceiptTransactions] = useState<Omit<Transaction, 'id'>[] | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState('');
  const [sidenavOpen, setSidenavOpen] = useState(false);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      const [walletsRes, categoriesRes, transactionsRes, settingsRes] = await Promise.all([
        fetch('/api/wallets', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/transactions', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ]);
      
      const parseJsonSafely = async (res: Response, fallback: any) => {
        if (!res.ok) {
          console.error(`API Error: ${res.status} ${res.statusText}`);
          return fallback;
        }
        const text = await res.text();
        if (!text) return fallback;
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          return fallback;
        }
      };

      const [walletsData, categoriesData, transactionsData, settingsData] = await Promise.all([
        parseJsonSafely(walletsRes, []),
        parseJsonSafely(categoriesRes, []),
        parseJsonSafely(transactionsRes, []),
        parseJsonSafely(settingsRes, {}),
      ]);

      setWallets(Array.isArray(walletsData) ? walletsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      
      if (settingsData.activeAlgorithm) {
        setActiveAlgorithm(settingsData.activeAlgorithm as AllocationAlgorithm);
      }
      if (settingsData.customAlgorithmGroups) {
        try { setCustomAlgorithmGroups(JSON.parse(settingsData.customAlgorithmGroups)); } catch {}
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  // --- Handlers ---
  const handleSaveWallet = async () => {
    if (!newWallet.name) return;
    setIsProcessing(true);
    setProcessMessage(editWalletId ? 'Memperbarui dompet...' : 'Membuat dompet baru...');
    try {
      if (editWalletId) {
        await fetch(`/api/wallets/${editWalletId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWallet),
        });
      } else {
        await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWallet),
        });
      }
      setShowWalletModal(false);
      setNewWallet({ name: '', balance: 0, color: 'bg-teal-500', bankName: '', accountNumber: '', accountName: '', allocationGroup: '' });
      setEditWalletId(null);
      await fetchData();
    } catch (error) {
      console.error('Save wallet failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePinWallet = async (wallet: Wallet) => {
    if (!wallet.isPinned && wallets.filter(w => w.isPinned).length >= 3) {
      alert('Maksimal 3 dompet yang bisa di-pin ke Dashboard!');
      return;
    }
    setIsProcessing(true);
    setProcessMessage(wallet.isPinned ? 'Menghapus pin dompet...' : 'Menandai dompet...');
    try {
      await fetch(`/api/wallets/${wallet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wallet, isPinned: !wallet.isPinned }),
      });
      await fetchData();
    } catch (error) {
      console.error('Toggle pin wallet failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    const wallet = wallets.find(w => w.id === id);
    const txCount = transactions.filter(t => t.walletId === id).length;
    const message = txCount > 0
      ? `Dompet "${wallet?.name}" memiliki ${txCount} transaksi yang akan ikut terhapus secara permanen. Lanjutkan?`
      : `Yakin ingin menghapus dompet "${wallet?.name}"?`;
    if (!window.confirm(message)) return;
    setIsProcessing(true);
    setProcessMessage('Menghapus dompet...');
    try {
      await fetch(`/api/wallets/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Delete wallet failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransfer = async (sourceWalletId: string, destWalletId: string, amount: number, date: string, note: string) => {
    setIsProcessing(true);
    setProcessMessage('Memproses transfer...');
    try {
      const response = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceWalletId, destWalletId, amount, date, note }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transfer gagal');
      }
      await fetchData();
    } catch (error: any) {
      console.error('Transfer failed:', error);
      alert(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditWallet = (wallet: Wallet | null) => {
    if (wallet) {
      setEditWalletId(wallet.id);
      setNewWallet({
        name: wallet.name, balance: wallet.balance, color: wallet.color,
        bankName: wallet.bankName || '', accountNumber: wallet.accountNumber || '',
        accountName: wallet.accountName || '', allocationGroup: wallet.allocationGroup || ''
      });
    } else {
      setEditWalletId(null);
      setNewWallet({ name: '', balance: 0, color: 'bg-teal-500', bankName: '', accountNumber: '', accountName: '', allocationGroup: '' });
    }
    setShowWalletModal(true);
  };

  const handleSaveCategory = async (categoryData: {id?: string, name: string, type: 'income'|'expense', color: string}) => {
    if (!categoryData.name) return;
    setIsProcessing(true);
    setProcessMessage(categoryData.id ? 'Memperbarui kategori...' : 'Membuat kategori baru...');
    try {
      if (categoryData.id) {
        await fetch(`/api/categories/${categoryData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });
      }
      await fetchData();
    } catch (error) {
      console.error('Save category failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    const txCount = transactions.filter(t => t.category === category?.name).length;
    const message = txCount > 0
      ? `Kategori "${category?.name}" digunakan oleh ${txCount} transaksi. Transaksi tersebut akan tetap ada namun kategorinya menjadi tidak terdaftar. Lanjutkan?`
      : `Yakin ingin menghapus kategori "${category?.name}"?`;
    if (!window.confirm(message)) return;
    setIsProcessing(true);
    setProcessMessage('Menghapus kategori...');
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Delete category failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeTransactions = async (txsData: Omit<Transaction, 'id'>[]) => {
    setIsProcessing(true);
    setProcessMessage('Menyimpan transaksi...');
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txsData),
      });
      await fetchData();
    } catch (error) {
      console.error('Execute transactions failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini? Saldo dompet akan dikembalikan.')) return;
    setIsProcessing(true);
    setProcessMessage('Menghapus transaksi...');
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Delete transaction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditTransaction = async (updatedTx: Transaction) => {
    setIsProcessing(true);
    setProcessMessage('Memperbarui transaksi...');
    try {
      await fetch(`/api/transactions/${updatedTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx),
      });
      setEditingTransaction(null);
      await fetchData();
    } catch (error) {
      console.error('Edit transaction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetActiveAlgorithm = async (algo: AllocationAlgorithm) => {
    setActiveAlgorithm(algo);
    setIsProcessing(true);
    setProcessMessage('Menyimpan pengaturan algoritma...');
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'activeAlgorithm', value: algo }),
      });
    } catch (error) {
      console.error('Save algorithm failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetCustomAlgorithmGroups = async (groups: CustomAlgorithmGroup[]) => {
    setCustomAlgorithmGroups(groups);
    setIsProcessing(true);
    setProcessMessage('Menyimpan pengaturan grup kustom...');
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'customAlgorithmGroups', value: JSON.stringify(groups) }),
      });
    } catch (error) {
      console.error('Save custom groups failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateWallets = async (newWallets: Wallet[]) => {
    // For drag-and-drop: update allocationGroup on changed wallets
    setIsProcessing(true);
    setProcessMessage('Menyimpan perubahan urutan dompet...');
    try {
      for (const w of newWallets) {
        const existing = wallets.find(ow => ow.id === w.id);
        if (existing && existing.allocationGroup !== w.allocationGroup) {
          await fetch(`/api/wallets/${w.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(w),
          });
        }
      }
      await fetchData();
    } catch (error) {
      console.error('Update wallets failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const approveAllocation = async (allocations: Allocation[]) => {
    if (!allocationProposal) return;
    const txsData: Omit<Transaction, 'id'>[] = [];
    let totalAllocated = 0;

    allocations.forEach((alloc, index) => {
      totalAllocated += alloc.amount;
      txsData.push({
        type: 'income',
        amount: alloc.amount,
        category: allocationProposal.category || 'Pemasukan',
        note: `${allocationProposal.note || 'Alokasi Pemasukan'} - Otomatis AI`,
        walletId: alloc.walletId,
        date: new Date(Date.now() + index).toISOString()
      });
    });

    const remaining = allocationProposal.amount - totalAllocated;
    if (remaining > 0) {
      const dailyWallet = wallets.find(w => w.name.toLowerCase().includes('daily')) || wallets[0];
      if (dailyWallet) {
        txsData.push({
          type: 'income',
          amount: remaining,
          category: allocationProposal.category || 'Pemasukan',
          note: `${allocationProposal.note || 'Sisa Alokasi Pemasukan'} - Otomatis AI`,
          walletId: dailyWallet.id,
          date: new Date(Date.now() + allocations.length).toISOString()
        });
      }
    }

    await executeTransactions(txsData);
    setAllocationProposal(null);
    setActiveTab('dashboard');
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat data keuangan Kamu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 font-sans">
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          <span className="font-bold text-lg text-slate-800 tracking-tight">FINA</span>
        </div>
        <span className="text-sm font-medium text-slate-500 capitalize">
          {NAV_ITEMS.find(n => n.id === activeTab)?.label}
        </span>
      </header>

      {/* Desktop Sidenav */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200/80 flex-col z-40">
        <div className="px-6 h-16 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-800 leading-tight">FINA Advisor</h1>
            <p className="text-[10px] text-slate-400 font-medium">Financial AI Assistant</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-teal-700'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-slate-100 text-xs text-slate-400">
          Powered by Lab Sekolah WFA
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            if (item.id === 'ai-input') {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative -top-5 flex flex-col items-center justify-center group"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30 transition-transform active:scale-95 ${isActive ? 'bg-teal-700' : 'bg-gradient-to-tr from-teal-500 to-cyan-500'}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`absolute -bottom-4 text-[10px] font-bold ${isActive ? 'text-teal-700' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] ${isActive
                  ? 'text-teal-600'
                  : 'text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-teal-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : ''}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-teal-700' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-14 pb-20 lg:pt-0 lg:pb-0 lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {activeTab === 'dashboard' && (
            <DashboardTab 
              wallets={wallets} 
              transactions={transactions} 
              categories={categories}
              formatRupiah={formatRupiah}
              onNavigate={(tab) => setActiveTab(tab as TabType)}
              onEditTransaction={setEditingTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletsTab 
              wallets={wallets} 
              transactions={transactions}
              formatRupiah={formatRupiah} 
              activeAlgorithm={activeAlgorithm}
              setActiveAlgorithm={handleSetActiveAlgorithm}
              onOpenEditWallet={openEditWallet} 
              onDeleteWallet={handleDeleteWallet} 
              onTogglePinWallet={handleTogglePinWallet}
              onOpenTransferModal={() => setShowTransferModal(true)}
              onUpdateWallets={handleUpdateWallets}
              onEditTransaction={setEditingTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              customAlgorithmGroups={customAlgorithmGroups}
              setCustomAlgorithmGroups={handleSetCustomAlgorithmGroups}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab 
              categories={categories}
              transactions={transactions}
              formatRupiah={formatRupiah}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onEditTransaction={setEditingTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'ai-input' && (
            <AiInputTab 
              wallets={wallets} 
              categories={categories}
              onExecuteTransactions={executeTransactions} 
              onShowAllocationProposal={setAllocationProposal} 
              onShowReceipt={setReceiptTransactions}
            />
          )}

          {activeTab === 'ai-advisor' && (
            <AiAdvisorTab 
              wallets={wallets}
              transactions={transactions}
              formatRupiah={formatRupiah}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {showWalletModal && (
        <WalletModal 
          editWalletId={editWalletId}
          newWallet={newWallet}
          setNewWallet={setNewWallet}
          activeAlgorithm={activeAlgorithm}
          onSave={handleSaveWallet}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      {allocationProposal && (
        <AllocationModal 
          proposal={allocationProposal}
          wallets={wallets}
          onApprove={approveAllocation}
          onCancel={() => setAllocationProposal(null)}
        />
      )}

      {receiptTransactions && (
        <SuccessReceiptModal
          transactions={receiptTransactions}
          wallets={wallets}
          formatRupiah={formatRupiah}
          onClose={() => setReceiptTransactions(null)}
        />
      )}

      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          wallets={wallets}
          categories={categories}
          onSave={handleEditTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {showTransferModal && (
        <TransferModal
          wallets={wallets}
          onTransfer={handleTransfer}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      {/* Global Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center transition-all animate-in fade-in duration-200">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
            <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="text-slate-700 font-semibold">{processMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
