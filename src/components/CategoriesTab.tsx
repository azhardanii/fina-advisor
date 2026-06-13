import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Category, Transaction } from '@/types';
import CategoryModal from './CategoryModal';
import CategoryDetailModal from './CategoryDetailModal';

interface CategoriesTabProps {
  categories: Category[];
  transactions: Transaction[];
  formatRupiah: (number: number) => string;
  onSaveCategory: (category: {id?: string, name: string, type: 'income'|'expense', color: string}) => void;
  onDeleteCategory: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export default function CategoriesTab({ categories, transactions, formatRupiah, onSaveCategory, onDeleteCategory, onEditTransaction, onDeleteTransaction }: CategoriesTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);

  const openEditModal = (cat: Category | null) => {
    setEditCategory(cat);
    setShowModal(true);
  };

  const handleSave = (categoryData: any) => {
    onSaveCategory(categoryData);
    setShowModal(false);
  };

  const getIconTheme = (colorClass: string) => {
    const colorName = colorClass.split('-')[1];
    const map: Record<string, string> = {
      'slate': 'bg-slate-100 text-slate-600',
      'gray': 'bg-gray-100 text-gray-600',
      'stone': 'bg-stone-100 text-stone-600',
      'red': 'bg-red-100 text-red-600',
      'orange': 'bg-orange-100 text-orange-600',
      'amber': 'bg-amber-100 text-amber-600',
      'yellow': 'bg-yellow-100 text-yellow-600',
      'lime': 'bg-lime-100 text-lime-600',
      'green': 'bg-green-100 text-green-600',
      'emerald': 'bg-emerald-100 text-emerald-600',
      'teal': 'bg-teal-100 text-teal-600',
      'cyan': 'bg-cyan-100 text-cyan-600',
      'sky': 'bg-sky-100 text-sky-600',
      'blue': 'bg-blue-100 text-blue-600',
      'indigo': 'bg-indigo-100 text-indigo-600',
      'violet': 'bg-violet-100 text-violet-600',
      'purple': 'bg-purple-100 text-purple-600',
      'fuchsia': 'bg-fuchsia-100 text-fuchsia-600',
      'pink': 'bg-pink-100 text-pink-600',
      'rose': 'bg-rose-100 text-rose-600',
    };
    return map[colorName] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Kategori</h2>
        <button 
          onClick={() => openEditModal(null)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2"/> Kategori Baru
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-teal-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Kategori</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Kategori membantu AI mengelompokkan pengeluaran dan pemasukan Kamu. Silakan buat kategori pertama Kamu.
          </p>
          <button 
            onClick={() => openEditModal(null)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/30"
          >
            Buat Kategori Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => setDetailCategory(cat)}
              className="bg-white cursor-pointer hover:shadow-md transition-shadow rounded-2xl shadow-sm border border-slate-200 p-5 relative overflow-hidden group flex items-center"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${cat.color}`}></div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${getIconTheme(cat.color)}`}>
                {cat.type === 'income' ? <ArrowDownCircle className="w-6 h-6"/> : <ArrowUpCircle className="w-6 h-6"/>}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800">{cat.name}</h3>
                <p className="text-sm text-slate-500">{cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</p>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(cat); }} 
                  className="p-1.5 text-slate-400 hover:text-teal-600 rounded-md hover:bg-teal-50"
                >
                  <Edit2 className="w-4 h-4"/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }} 
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CategoryModal
          editCategory={editCategory}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {detailCategory && (
        <CategoryDetailModal
          category={detailCategory}
          transactions={transactions}
          formatRupiah={formatRupiah}
          onClose={() => setDetailCategory(null)}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onDeleteTransaction}
        />
      )}
    </div>
  );
}
