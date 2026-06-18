import React, { useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Search, Filter, Calendar, Edit2, Trash2, ChevronDown, ChevronUp, X, Sparkles, ListFilter } from 'lucide-react';
import { Wallet, Transaction, Category } from '@/types';
import { getIconTheme } from '@/lib/theme';

interface TransactionsTabProps {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  formatRupiah: (number: number) => string;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onOpenChat?: () => void;
}

export default function TransactionsTab({
  wallets,
  transactions,
  categories,
  formatRupiah,
  onEditTransaction,
  onDeleteTransaction,
  onOpenChat,
}: TransactionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterWallet, setFilterWallet] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const isEditable = (dateStr: string) => {
    return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
  };

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // Filter by category
    if (filterCategory) {
      result = result.filter(t => t.category === filterCategory);
    }

    // Filter by wallet
    if (filterWallet) {
      result = result.filter(t => t.walletId === filterWallet);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.note || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        formatRupiah(t.amount).toLowerCase().includes(q)
      );
    }

    // Filter by date range
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(t => new Date(t.date) >= start);
    } else if (dateRange === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      result = result.filter(t => new Date(t.date) >= start);
    } else if (dateRange === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter(t => new Date(t.date) >= start);
    } else if (dateRange === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }

    // Sort by date desc
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [transactions, filterType, filterCategory, filterWallet, searchQuery, dateRange, customStart, customEnd, formatRupiah]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(tx => {
      const dateKey = new Date(tx.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const activeFilterCount = [
    filterType !== 'all',
    filterCategory !== '',
    filterWallet !== '',
    dateRange !== 'month',
  ].filter(Boolean).length;

  if (transactions.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ListFilter className="w-10 h-10 text-teal-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Transaksi</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Mulai catat transaksi keuanganmu lewat chat FINA untuk melihat riwayat lengkap di sini.
          </p>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/20 inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Mulai Chat FINA
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ListFilter className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
          Semua Transaksi
        </h2>
        <p className="text-slate-500 text-sm mt-1">Validasi dan kelola riwayat keuanganmu</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 sm:p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-medium text-emerald-700">Pemasukan</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-800 truncate">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 sm:p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs sm:text-sm font-medium text-red-700">Pengeluaran</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-red-800 truncate">{formatRupiah(totalExpense)}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400 min-w-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 p-2.5 rounded-lg border transition-all relative ${
              showFilters || activeFilterCount > 0
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-slate-100 p-3 space-y-3 bg-slate-50/50 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Type Filter */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tipe</label>
              <div className="flex gap-2">
                {([['all', 'Semua'], ['income', 'Pemasukan'], ['expense', 'Pengeluaran']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterType(val)}
                    className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                      filterType === val
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Periode</label>
              <div className="flex flex-wrap gap-1.5">
                {([['today', 'Hari Ini'], ['week', '7 Hari'], ['month', 'Bulan Ini'], ['all', 'Semua'], ['custom', 'Custom']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setDateRange(val)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      dateRange === val
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-slate-400 text-sm">–</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            {/* Category & Wallet Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Kategori</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Semua</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Dompet</label>
                <select
                  value={filterWallet}
                  onChange={(e) => setFilterWallet(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Semua</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterCategory('');
                  setFilterWallet('');
                  setDateRange('month');
                  setCustomStart('');
                  setCustomEnd('');
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset semua filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction Count */}
      <p className="text-xs text-slate-500 px-1">
        Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
      </p>

      {/* Grouped Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Tidak ada transaksi yang cocok</p>
          <p className="text-slate-400 text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedTransactions).map(([dateLabel, txs]) => {
            const isExpanded = expandedDate === null || expandedDate === dateLabel;
            const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

            return (
              <div key={dateLabel} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Date Group Header */}
                <button
                  onClick={() => setExpandedDate(expandedDate === dateLabel ? '__none__' : dateLabel)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-bold text-slate-700 truncate">{dateLabel}</span>
                    <span className="text-xs text-slate-400 shrink-0">({txs.length})</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      {dayIncome > 0 && <span className="text-emerald-600 font-medium">+{formatRupiah(dayIncome)}</span>}
                      {dayExpense > 0 && <span className="text-red-600 font-medium">-{formatRupiah(dayExpense)}</span>}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Transactions under this date */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {txs.map(tx => {
                      const wallet = wallets.find(w => w.id === tx.walletId);
                      const category = categories.find(c => c.name === tx.category);
                      const iconTheme = category
                        ? getIconTheme(category.color)
                        : tx.type === 'income'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600';

                      return (
                        <div key={tx.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconTheme}`}>
                              {tx.type === 'income' ? (
                                <ArrowDownCircle className="w-4 h-4" />
                              ) : (
                                <ArrowUpCircle className="w-4 h-4" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm text-slate-800 truncate">
                                    {tx.note || 'Transaksi'}
                                  </p>
                                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                                      {tx.category}
                                    </span>
                                    {wallet && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-white ${wallet.color || 'bg-gray-400'}`}>
                                        {wallet.name}
                                      </span>
                                    )}
                                    <span className="text-[11px] text-slate-400">
                                      {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right shrink-0">
                                  <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              {isEditable(tx.date) && onEditTransaction && onDeleteTransaction && (
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => onEditTransaction(tx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md border border-slate-200 transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md border border-slate-200 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" /> Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
