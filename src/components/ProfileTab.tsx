import React, { useState, useEffect } from 'react';
import { User, Briefcase, Target, ShieldAlert, MessageCircle, Save } from 'lucide-react';

export type UserProfile = {
  name: string;
  occupation: string;
  incomeBracket: string;
  financialGoal: string;
  riskTolerance: string;
  tonePreference: string;
};

type ProfileTabProps = {
  profile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
};

export default function ProfileTab({ profile, onSaveProfile }: ProfileTabProps) {
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    occupation: '',
    incomeBracket: '',
    financialGoal: '',
    riskTolerance: 'Moderat',
    tonePreference: 'Santai & Ramah'
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        occupation: profile.occupation || '',
        incomeBracket: profile.incomeBracket || '',
        financialGoal: profile.financialGoal || '',
        riskTolerance: profile.riskTolerance || 'Moderat',
        tonePreference: profile.tonePreference || 'Santai & Ramah'
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveProfile(formData);
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-teal-900/5 border border-slate-100 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Profil & Persona</h2>
          <p className="text-sm text-slate-500">Personalisasi identitasmu agar FINA lebih mengenalmu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" /> Nama Panggilan
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Misal: Alex"
            className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-slate-50 p-3"
            required
          />
        </div>

        {/* Occupation & Income */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-600" /> Pekerjaan / Status
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="Misal: Mahasiswa / Freelancer"
              className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-slate-50 p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              💰 Rentang Pemasukan
            </label>
            <select
              name="incomeBracket"
              value={formData.incomeBracket}
              onChange={handleChange}
              className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-slate-50 p-3"
            >
              <option value="">Pilih...</option>
              <option value="< Rp 5.000.000">Kurang dari Rp 5 Juta</option>
              <option value="Rp 5.000.000 - Rp 10.000.000">Rp 5 Juta - Rp 10 Juta</option>
              <option value="Rp 10.000.000 - Rp 25.000.000">Rp 10 Juta - Rp 25 Juta</option>
              <option value="> Rp 25.000.000">Lebih dari Rp 25 Juta</option>
            </select>
          </div>
        </div>

        {/* Financial Goal */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-600" /> Tujuan Finansial (Financial Goal)
          </label>
          <textarea
            name="financialGoal"
            value={formData.financialGoal}
            onChange={handleChange}
            placeholder="Misal: Ingin mengumpulkan DP rumah 50 juta dalam 2 tahun, atau ingin melunasi hutang pinjol."
            rows={3}
            className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-slate-50 p-3 resize-none"
          />
        </div>

        {/* Risk & Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal-600" /> Toleransi Risiko
            </label>
            <select
              name="riskTolerance"
              value={formData.riskTolerance}
              onChange={handleChange}
              className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-slate-50 p-3"
            >
              <option value="Konservatif">Konservatif (Main Aman)</option>
              <option value="Moderat">Moderat (Seimbang)</option>
              <option value="Agresif">Agresif (Berani Ambil Risiko)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-teal-600" /> Gaya Bahasa FINA
            </label>
            <select
              name="tonePreference"
              value={formData.tonePreference}
              onChange={handleChange}
              className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-slate-50 p-3"
            >
              <option value="Santai & Ramah">Santai & Ramah (Default)</option>
              <option value="Tegas & Disiplin">Tegas & Disiplin</option>
              <option value="Motivator">Motivator (Selalu Menyemangati)</option>
              <option value="Sarkas/Roasting">Sarkas / Tukang Roasting 🔥</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <><Save className="w-5 h-5" /> Simpan Profil</>
          )}
        </button>
      </form>
    </div>
  );
}
