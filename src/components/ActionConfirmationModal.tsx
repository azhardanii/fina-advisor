import React, { useState } from 'react';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';

type ActionConfirmationModalProps = {
  description: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export default function ActionConfirmationModal({ description, onConfirm, onCancel }: ActionConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-amber-900">Konfirmasi Aksi FINA</h2>
          <p className="text-amber-700 mt-2 text-sm">FINA meminta izin untuk mengeksekusi aksi berikut:</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-slate-800 font-medium text-center text-lg">{description}</p>
          </div>

          <p className="text-sm text-slate-500 text-center mb-6">
            Apakah kamu yakin ingin melanjutkan? Tindakan ini mungkin akan memodifikasi databasemu secara permanen.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <X className="w-5 h-5" /> Tolak
              </div>
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70"
            >
              <div className="flex items-center justify-center gap-2">
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><Check className="w-5 h-5" /> Yakin, Lakukan!</>
                )}
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
