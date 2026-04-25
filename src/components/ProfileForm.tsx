import React, { useState, useRef } from 'react';
import { calculateBMR, calculateDailyGoal, calculateExpirationDate } from '../utils/calories';
import type { ActivityLevel } from '../utils/calories';
import { supabase } from '../lib/supabase';

const WORKER_ANALYZE_BIOIMP = import.meta.env.VITE_WORKER_ANALYZE_BIOIMP || 'http://localhost:8788';

interface ProfileFormProps {
  onComplete: (data: any) => void;
}

interface BioimData {
  bodyFatPercent?: number;
  leanMassKg?: number;
  fatMassKg?: number;
  bodyWaterPercent?: number;
  metabolicAge?: number;
  basalMetabolicRate?: number;
  visceralFat?: number;
  boneMassKg?: number;
  deviceBrand?: string;
  confidence?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [bioimLoading, setBioimLoading] = useState(false);
  const [bioimData, setBioimData] = useState<BioimData | null>(null);
  const [bioimPreview, setBioimPreview] = useState<string | null>(null);
  const [bioimError, setBioimError] = useState<string | null>(null);
  const [showBioimSection, setShowBioimSection] = useState(false);
  const bioimInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    idade: '',
    sexo: 'Masculino' as 'Masculino' | 'Feminino',
    fatorAtividade: 'Sedentário' as ActivityLevel,
    plano: '3 meses' as '3 meses' | '6 meses' | '1 ano',
  });

  const handleBioimUpload = async (file: File) => {
    setBioimError(null);
    setBioimData(null);
    setBioimLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setBioimPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      const mimeType = dataUrl.split(';')[0].split(':')[1];

      try {
        const response = await fetch(WORKER_ANALYZE_BIOIMP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType })
        });

        const result: BioimData & { error?: string } = await response.json();

        if (result.error) {
          setBioimError(result.error);
        } else {
          setBioimData(result);
          // Auto-fill BMR if available
          if (result.basalMetabolicRate) {
            // Stored internally; will be used in handleSubmit
          }
        }
      } catch {
        setBioimError('Erro ao analisar o laudo. Tente novamente.');
      } finally {
        setBioimLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    const idade = parseInt(formData.idade);

    const bmr = bioimData?.basalMetabolicRate || calculateBMR(peso, altura, idade, formData.sexo);
    const metaCalorica = calculateDailyGoal(bmr, formData.fatorAtividade);
    const dataExpiracao = calculateExpirationDate(formData.plano);

    const userData = {
      ...formData,
      peso,
      altura,
      idade,
      meta_calorica: metaCalorica,
      data_expiracao: dataExpiracao.toISOString(),
      created_at: new Date().toISOString(),
      bioimpedancia: bioimData || null,
    };

    try {
      await supabase.from('usuarios').insert([userData]);
      onComplete(userData);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      onComplete(userData);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-4 bg-white/50 border-none rounded-2xl clay-effect focus:ring-2 focus:ring-blue-400 outline-none text-slate-700 placeholder:text-slate-400 font-medium transition-all";
  const labelClasses = "block text-sm font-black text-slate-500 mb-2 ml-1 uppercase tracking-wider";

  return (
    <div className="max-w-xl mx-auto p-6 animate-fade-in">
      <div className="mb-10 text-center">
        <span className="material-symbols-outlined text-blue-500 text-5xl mb-4 block">account_circle</span>
        <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Criar Plano de Elite</h2>
        <p className="text-slate-500 font-semibold text-lg">Preencha seus dados para um protocolo personalizado.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-blue-50/60 p-8 rounded-[2.5rem] clay-effect">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClasses}>Peso (kg)</label>
            <input type="number" step="0.1" required className={inputClasses}
              value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
              placeholder="Ex: 75.5" />
          </div>
          <div>
            <label className={labelClasses}>Altura (cm)</label>
            <input type="number" required className={inputClasses}
              value={formData.altura} onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
              placeholder="Ex: 180" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClasses}>Idade</label>
            <input type="number" required className={inputClasses}
              value={formData.idade} onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
              placeholder="Ex: 28" />
          </div>
          <div>
            <label className={labelClasses}>Sexo</label>
            <select className={inputClasses} value={formData.sexo}
              onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Nível de Atividade</label>
          <select className={inputClasses} value={formData.fatorAtividade}
            onChange={(e) => setFormData({ ...formData, fatorAtividade: e.target.value as any })}>
            <option value="Sedentário">Sedentário (sem exercício)</option>
            <option value="Leve">Leve (1-3 dias/semana)</option>
            <option value="Moderado">Moderado (3-5 dias/semana)</option>
            <option value="Muito Ativo">Muito Ativo (6-7 dias/semana)</option>
          </select>
        </div>

        <div>
          <label className={labelClasses}>Plano de Duração</label>
          <div className="grid grid-cols-3 gap-3">
            {(['3 meses', '6 meses', '1 ano'] as const).map((p) => (
              <button key={p} type="button"
                onClick={() => setFormData({ ...formData, plano: p })}
                className={`py-4 px-2 rounded-2xl text-sm font-bold transition-all ${
                  formData.plano === p
                    ? 'bg-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                    : 'clay-button text-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Bioimpedance Section */}
        <div className="border-t-2 border-white/60 pt-6">
          <button
            type="button"
            onClick={() => setShowBioimSection(!showBioimSection)}
            className="w-full clay-button rounded-2xl p-5 flex items-center gap-4 text-left"
          >
            <span className="material-symbols-outlined text-blue-400 text-3xl">biotech</span>
            <div className="flex-1">
              <p className="font-black text-slate-700">Laudo de Bioimpedância</p>
              <p className="text-slate-400 font-semibold text-xs">Opcional • Extração automática dos dados do laudo</p>
            </div>
            <span className={`material-symbols-outlined text-slate-400 transition-transform ${showBioimSection ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {showBioimSection && (
            <div className="mt-4 clay-effect rounded-3xl p-6">
              {!bioimPreview ? (
                <div className="text-center">
                  <span className="material-symbols-outlined text-blue-200 text-5xl block mb-3">document_scanner</span>
                  <p className="text-slate-500 font-semibold text-sm mb-5">
                    Envie uma foto do seu laudo (InBody, Tanita, etc.)
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button type="button"
                      onClick={() => { bioimInputRef.current?.setAttribute('capture', 'environment'); bioimInputRef.current?.click(); }}
                      className="clay-button text-blue-600 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">camera_alt</span> Câmera
                    </button>
                    <button type="button"
                      onClick={() => { bioimInputRef.current?.removeAttribute('capture'); bioimInputRef.current?.click(); }}
                      className="clay-button text-slate-600 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span> Upload
                    </button>
                  </div>
                  <input ref={bioimInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBioimUpload(f); e.target.value = ''; }} />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img src={bioimPreview} alt="Laudo" className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1">
                      {bioimLoading && (
                        <div className="flex items-center gap-2 text-blue-500">
                          <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                          <span className="text-sm font-bold">Analisando laudo...</span>
                        </div>
                      )}
                      {bioimError && <p className="text-red-400 text-sm font-bold">{bioimError}</p>}
                      {bioimData && (
                        <div className="flex items-center gap-2 text-green-500">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span className="text-sm font-black">Laudo analisado!</span>
                          {bioimData.deviceBrand && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">{bioimData.deviceBrand}</span>}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => { setBioimPreview(null); setBioimData(null); setBioimError(null); }}
                      className="clay-button w-8 h-8 rounded-full flex items-center justify-center text-slate-400 text-xs">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {bioimData && (
                    <div className="grid grid-cols-2 gap-3">
                      {bioimData.bodyFatPercent != null && (
                        <div className="clay-effect rounded-2xl p-3 text-center">
                          <p className="text-blue-500 font-black text-xl">{bioimData.bodyFatPercent}%</p>
                          <p className="text-slate-400 font-bold text-xs">% Gordura</p>
                        </div>
                      )}
                      {bioimData.leanMassKg != null && (
                        <div className="clay-effect rounded-2xl p-3 text-center">
                          <p className="text-blue-500 font-black text-xl">{bioimData.leanMassKg}kg</p>
                          <p className="text-slate-400 font-bold text-xs">Massa Magra</p>
                        </div>
                      )}
                      {bioimData.bodyWaterPercent != null && (
                        <div className="clay-effect rounded-2xl p-3 text-center">
                          <p className="text-blue-500 font-black text-xl">{bioimData.bodyWaterPercent}%</p>
                          <p className="text-slate-400 font-bold text-xs">Água Corporal</p>
                        </div>
                      )}
                      {bioimData.metabolicAge != null && (
                        <div className="clay-effect rounded-2xl p-3 text-center">
                          <p className="text-blue-500 font-black text-xl">{bioimData.metabolicAge}</p>
                          <p className="text-slate-400 font-bold text-xs">Idade Metabólica</p>
                        </div>
                      )}
                      {bioimData.basalMetabolicRate != null && (
                        <div className="clay-effect rounded-2xl p-3 text-center col-span-2">
                          <p className="text-green-500 font-black text-xl">{bioimData.basalMetabolicRate} kcal</p>
                          <p className="text-slate-400 font-bold text-xs">TMB (do laudo) — será usado no plano</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-5 bg-blue-500 text-white rounded-full font-black text-xl shadow-[0_8px_24px_rgba(59,130,246,0.3)] hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <><span className="material-symbols-outlined animate-spin">refresh</span>Processando...</>
          ) : (
            <><span className="material-symbols-outlined">rocket_launch</span>Gerar Protocolo</>
          )}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
