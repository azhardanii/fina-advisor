import React, { useState } from 'react';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, Sparkles, Edit2, Trash2, Pin, ArrowDownCircle, ArrowUpCircle, Wallet as WalletIcon, X, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Wallet, Transaction, Category } from '@/types';
import { getIconTheme } from '@/lib/theme';

interface DashboardTabProps {
  wallets: Wallet[];
  transactions: Transaction[];
  formatRupiah: (number: number) => string;
  categories: Category[];
  onNavigate: (tab: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export default function DashboardTab({ wallets, transactions, categories, formatRupiah, onNavigate, onEditTransaction, onDeleteTransaction }: DashboardTabProps) {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isEditable = (dateStr: string) => {
    return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
  };

  const getTotalBalance = () => wallets.reduce((sum, w) => sum + w.balance, 0);
  const getTotalIncome = () => transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const getTotalExpense = () => transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Category Distribution Data
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const expensesByCategory = expenseTransactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const CHART_COLORS = ['#0d9488', '#0284c7', '#2563eb', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#d97706', '#65a30d', '#16a34a'];
  
  const categoryData = Object.entries(expensesByCategory)
    .filter(([_, amount]) => amount > 0)
    .map(([name, amount], index) => ({
      name,
      value: amount,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);

  const displayedTransactions = selectedCategory 
    ? transactions.filter(t => t.category === selectedCategory)
    : transactions;


  const isSettingUp = categories.length === 0 || wallets.length === 0 || transactions.length === 0;

  if (isSettingUp) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-teal-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Selamat Datang di FINA!</h2>
          <p className="text-slate-500 mb-10 max-w-lg mx-auto">
            Mari siapkan asisten keuangan pintar Kamu. Ikuti 3 langkah mudah di bawah ini untuk memulai perjalanan finansial yang lebih cerdas.
          </p>

          <div className="max-w-3xl mx-auto space-y-6 text-left relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {/* Step 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${categories.length > 0 ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600'}`}>
                1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <h3 className="font-bold text-slate-800 mb-1">Buat Kategori Pertama</h3>
                <p className="text-sm text-slate-500 mb-4">Kelompokkan pengeluaran dan pemasukan Kamu agar AI bisa memahaminya.</p>
                {categories.length === 0 ? (
                  <button onClick={() => onNavigate('categories')} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">Mulai Buat Kategori</button>
                ) : (
                  <span className="text-teal-600 text-sm font-bold flex items-center">✓ Selesai ({categories.length} Kategori)</span>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${wallets.length > 0 ? 'bg-teal-500 text-white' : (categories.length > 0 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400')}`}>
                2
              </div>
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md ${categories.length === 0 ? 'opacity-60' : ''}`}>
                <h3 className="font-bold text-slate-800 mb-1">Siapkan Dompet</h3>
                <p className="text-sm text-slate-500 mb-4">Buat dompet untuk memisahkan dan mengalokasikan dana Kamu.</p>
                {wallets.length === 0 ? (
                  <button disabled={categories.length === 0} onClick={() => onNavigate('wallets')} className="bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">Mulai Buat Dompet</button>
                ) : (
                  <span className="text-teal-600 text-sm font-bold flex items-center">✓ Selesai ({wallets.length} Dompet)</span>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${transactions.length > 0 ? 'bg-teal-500 text-white' : (wallets.length > 0 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400')}`}>
                3
              </div>
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md ${wallets.length === 0 ? 'opacity-60' : ''}`}>
                <h3 className="font-bold text-slate-800 mb-1">Mulai Catat Transaksi</h3>
                <p className="text-sm text-slate-500 mb-4">Gunakan Input AI untuk mencatat pengeluaran Kamu secepat kilat menggunakan bahasa sehari-hari.</p>
                {transactions.length === 0 ? (
                  <button disabled={wallets.length === 0} onClick={() => onNavigate('ai-input')} className="bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">Coba Input AI Sekarang</button>
                ) : (
                  <span className="text-teal-600 text-sm font-bold flex items-center">✓ Selesai</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 transform transition-all">
      {/* Header / Total Card */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-2xl shadow-xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <h2 className="text-teal-100 font-medium text-lg mb-1">Total Kekayaan Aktif</h2>
        <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          {formatRupiah(getTotalBalance())}
        </p>
        
        <div className="grid grid-cols-2 gap-4 border-t border-teal-400/30 pt-6">
          <div>
            <p className="text-teal-200 text-sm flex items-center"><TrendingUp className="w-4 h-4 mr-1 text-emerald-400"/> Total Pemasukan</p>
            <p className="text-xl font-semibold text-white">{formatRupiah(getTotalIncome())}</p>
          </div>
          <div>
            <p className="text-teal-200 text-sm flex items-center"><TrendingDown className="w-4 h-4 mr-1 text-red-300"/> Total Pengeluaran</p>
            <p className="text-xl font-semibold text-white">{formatRupiah(getTotalExpense())}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Pinned Wallets */}
        {wallets.filter(w => w.isPinned).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Pin className="w-5 h-5 mr-2 text-amber-500" fill="currentColor" /> Dompet Pilihan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {wallets.filter(w => w.isPinned).map(wallet => (
                <div 
                  key={wallet.id} 
                  onClick={() => onNavigate('wallets')} 
                  className="bg-slate-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all border border-slate-100 relative overflow-hidden group"
                >
                   <div className={`absolute top-0 left-0 w-1.5 h-full ${wallet.color}`}></div>
                   <div className="flex items-center mb-2">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getIconTheme(wallet.color)}`}>
                       <WalletIcon className="w-4 h-4"/>
                     </div>
                     <h4 className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{wallet.name}</h4>
                   </div>
                   {(wallet.bankName || wallet.accountNumber) && (
                     <p className="text-xs text-slate-500 mb-3 truncate">{wallet.bankName} {wallet.accountNumber ? `• ${wallet.accountNumber}` : ''}</p>
                   )}
                   <p className="text-xl font-bold text-teal-700 mt-2">{formatRupiah(wallet.balance)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Distribution Chart (CSS Based for reliability) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-teal-500"/> Alokasi Dompet
          </h3>
          <div className="space-y-4 mt-6">
            {[...wallets].sort((a,b) => b.balance - a.balance).map(wallet => {
              const percentage = getTotalBalance() === 0 ? 0 : (wallet.balance / getTotalBalance()) * 100;
              return (
                <div key={wallet.id} className="relative">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{wallet.name}</span>
                    <span className="text-slate-500">{formatRupiah(wallet.balance)} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${wallet.color}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Category Expense Distribution */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-teal-500"/> Distribusi Pengeluaran
          </h3>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(data) => setSelectedCategory(selectedCategory === data.name ? null : data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3 max-h-64 overflow-y-auto pr-2">
              <p className="text-sm text-slate-500 mb-2">Klik grafik atau kategori untuk melihat detail transaksinya.</p>
              {categoryData.map((cat, idx) => {
                const percentage = (cat.value / getTotalExpense()) * 100;
                const isSelected = selectedCategory === cat.name;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-teal-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="font-medium text-slate-700">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{formatRupiah(cat.value)}</p>
                      <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              Transaksi Terakhir 
              {selectedCategory && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory(null)} className="ml-1 hover:text-teal-900"><X className="w-3 h-3"/></button>
                </span>
              )}
            </h3>
            {displayedTransactions.length > 20 && (
              <button 
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                {showAllTransactions ? 'Tampilkan Sedikit' : `Lihat Semua (${displayedTransactions.length})`}
              </button>
            )}
          </div>
          {displayedTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Belum ada transaksi dicatat. Gunakan fitur Input AI!</div>
          ) : (
            <div className="space-y-3">
              {(showAllTransactions ? displayedTransactions : displayedTransactions.slice(0, 20)).map(tx => {
                const wallet = wallets.find(w => w.id === tx.walletId);
                const category = categories.find(c => c.name === tx.category);
                const iconTheme = category ? getIconTheme(category.color) : (tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600');
                return (
                <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${iconTheme}`}>
                      {tx.type === 'income' ? <ArrowDownCircle className="w-5 h-5"/> : <ArrowUpCircle className="w-5 h-5"/>}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{tx.category}</p>
                      <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-white ${wallet?.color || 'bg-gray-400'}`}>{wallet?.name || 'Unknown'}</span>
                      </div>
                      {tx.note && <p className="text-xs text-slate-500 mt-0.5">{tx.note}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </div>
                    {isEditable(tx.date) && onEditTransaction && onDeleteTransaction && (
                      <div className="flex space-x-2 mt-1">
                        <button onClick={() => onEditTransaction(tx)} className="text-slate-400 hover:text-teal-600 p-1">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDeleteTransaction(tx.id)} className="text-slate-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  );
}
