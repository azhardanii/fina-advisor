import React, { useState, useEffect } from 'react';
import { Category } from '@/types';

interface CategoryModalProps {
  editCategory: Category | null;
  onSave: (categoryData: {id?: string, name: string, type: 'income'|'expense', color: string}) => void;
  onClose: () => void;
}

const COLORS = ['bg-slate-400', 'bg-gray-400', 'bg-stone-400', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400', 'bg-rose-400'];

export default function CategoryModal({ editCategory, onSave, onClose }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income'|'expense'>('expense');
  const [color, setColor] = useState('bg-blue-500');

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setType(editCategory.type);
      setColor(editCategory.color);
    }
  }, [editCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: editCategory?.id, name, type, color });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">{editCategory ? 'Edit Kategori' : 'Kategori Baru'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kategori</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Cth: Transportasi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} className="text-teal-600 focus:ring-teal-500" />
                <span>Pengeluaran</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="income" checked={type === 'income'} onChange={() => setType('income')} className="text-teal-600 focus:ring-teal-500" />
                <span>Pemasukan</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Warna</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
                />
              ))}
            </div>
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
