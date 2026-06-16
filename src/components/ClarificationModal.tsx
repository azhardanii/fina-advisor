import React, { useState } from 'react';
import { XCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ClarificationItem {
  description: string;
  reason: string;
}

interface ClarificationModalProps {
  items: ClarificationItem[];
  onClose: () => void;
  onSubmit: (answers: string[]) => void;
}

export default function ClarificationModal({ items, onClose, onSubmit }: ClarificationModalProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(items.length).fill(''));
  const [error, setError] = useState<string>('');

  const handleChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    if (error) setError('');
  };

  const handleSubmit = () => {
    const emptyIndex = answers.findIndex(a => a.trim() === '');
    if (emptyIndex !== -1) {
      setError(`Tolong lengkapi penjelasan untuk transaksi nomor ${emptyIndex + 1} ya!`);
      return;
    }
    onSubmit(answers);
  };

  return (
    <div className="fixed inset-0 bg-teal-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10">
        <div className="bg-amber-50 px-6 py-6 text-center border-b border-amber-100 relative">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600"/>
          </div>
          <h3 className="font-bold text-2xl text-amber-900 mb-2">Ada yang Kurang Jelas Nih!</h3>
          <p className="text-amber-700 text-sm">FINA butuh bantuanmu untuk memperjelas beberapa transaksi sebelum dicatat ke database.</p>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-start mb-2">
                <span className="font-bold text-teal-600 w-6 mt-0.5">{idx + 1}.</span>
                <div>
                  <p className="font-semibold text-slate-800">{item.description}</p>
                  <p className="text-sm text-slate-500 italic mt-0.5">"{item.reason}"</p>
                </div>
              </div>
              <input 
                type="text" 
                value={answers[idx]}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder="Tuliskan peruntukannya..."
                className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          ))}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-medium border border-slate-200 text-slate-600 hover:bg-white transition-colors flex items-center justify-center"
          >
            <XCircle className="w-5 h-5 mr-2" /> Batalin Aja
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 flex justify-center items-center transition-transform hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-5 h-5 mr-2"/> Sudah Dibenerin
          </button>
        </div>
      </div>
    </div>
  );
}
