import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../utils/device';

const WORKER_URL = import.meta.env.VITE_WORKER_ANALYZE_FOOD || 'http://localhost:8787';

interface MealResult {
  calorias_totais: number;
  peso_estimado_g: number;
  carboidratos_g: number;
  proteinas_g: number;
  gordura_g: number;
  acucares_g: number;
  fibras_g: number;
  error?: string;
  details?: string;
}

interface MealCaptureProps {
  onMealSaved?: () => void; // callback para avisar o Dashboard que foi salvo
}

type Step = 'idle' | 'preview' | 'analyzing' | 'result' | 'saved';

const MealCapture: React.FC<MealCaptureProps> = ({ onMealSaved }) => {
  const [step, setStep] = useState<Step>('idle');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<MealResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
      setStep('preview');
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!imageDataUrl) return;
    setStep('analyzing');
    setError(null);

    const base64 = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(';')[0].split(':')[1];

    try {
      const payload = {
        image: base64,
        mimeType: mimeType
      };

      const resp = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: MealResult = await resp.json();

      if (data.error) {
        setError(`${data.error}: ${data.details || ''}`);
        setStep('preview');
      } else {
        setResult(data);
        setStep('result');
      }
    } catch (err: any) {
      console.error('Erro na análise:', err);
      setError(`Erro de Conexão: ${err.message}. URL tentada: ${WORKER_URL}`);
      setStep('preview');
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);

    const userId = getDeviceId();

    const { error: dbErr } = await supabase.from('refeicoes_diarias').insert([{
      user_id: userId,
      calorias_totais: result.calorias_totais,
      peso_estimado_g: result.peso_estimado_g,
      carboidratos_g: result.carboidratos_g,
      proteinas_g: result.proteinas_g,
      gordura_g: result.gordura_g,
      acucares_g: result.acucares_g,
      fibras_g: result.fibras_g,
    }]);

    setSaving(false);

    if (dbErr) {
      setError('Erro ao salvar no banco. Tente novamente.');
    } else {
      setStep('saved');
      onMealSaved?.();
    }
  };

  const handleReset = () => {
    setStep('idle');
    setImageDataUrl(null);
    setResult(null);
    setError(null);
  };

  // ── Variantes de UI por etapa ─────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">

      {/* Header */}
      <div className="text-center mb-8">
        <span className="material-symbols-outlined text-blue-400 text-5xl mb-3 block">add_a_photo</span>
        <h1 className="text-4xl font-black text-slate-800 mb-2">Cálculo Calórico</h1>
        <p className="text-slate-500 font-semibold">Fotografe seu prato e a IA calcula as calorias</p>
      </div>

      {/* ── Etapa: IDLE ── */}
      {step === 'idle' && (
        <div
          className="clay-effect rounded-[3rem] p-10 flex flex-col items-center gap-6 text-center"
          style={{ boxShadow: '8px 8px 20px rgba(163,177,198,0.5), -6px -6px 16px rgba(255,255,255,0.9), inset 0 1px 3px rgba(255,255,255,0.8)' }}
        >
          <div
            className="w-40 h-40 rounded-full flex items-center justify-center bg-blue-50"
            style={{ boxShadow: 'inset 4px 4px 12px rgba(163,177,198,0.4), inset -4px -4px 10px rgba(255,255,255,0.9)' }}
          >
            <span className="material-symbols-outlined text-blue-300 text-7xl">restaurant</span>
          </div>
          <p className="text-slate-400 font-bold text-sm max-w-xs">
            Tire uma foto do prato ou faça upload de uma imagem já salva
          </p>
          <div className="flex gap-4 w-full">
            {/* Botão câmera — 3D clay azul */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-5 rounded-3xl font-black text-white flex flex-col items-center gap-2 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                boxShadow: '6px 6px 14px rgba(37,99,235,0.4), -3px -3px 8px rgba(147,197,253,0.5), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(30,64,175,0.4)',
              }}
            >
              <span className="material-symbols-outlined text-3xl">camera_alt</span>
              <span className="text-sm">Câmera</span>
            </button>
            {/* Botão upload — 3D clay slate */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-5 rounded-3xl font-black text-slate-600 flex flex-col items-center gap-2 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(145deg, #f8faff, #e2eaff)',
                boxShadow: '6px 6px 14px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.9), inset 0 1px 3px rgba(255,255,255,0.8)',
              }}
            >
              <span className="material-symbols-outlined text-3xl text-blue-400">upload</span>
              <span className="text-sm">Galeria</span>
            </button>
          </div>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        </div>
      )}

      {/* ── Etapa: PREVIEW ── */}
      {(step === 'preview' || step === 'analyzing') && imageDataUrl && (
        <div className="clay-effect rounded-[3rem] overflow-hidden"
          style={{ boxShadow: '8px 8px 20px rgba(163,177,198,0.5), -6px -6px 16px rgba(255,255,255,0.9)' }}>
          {/* Imagem */}
          <div className="relative">
            <img src={imageDataUrl} alt="Prato capturado" className="w-full h-72 object-cover" />
            <button onClick={handleReset}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md"
            >
              <span className="material-symbols-outlined text-slate-600 text-lg">arrow_back</span>
            </button>
          </div>

          {/* Erro */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">warning</span>
              <p className="text-red-500 font-bold text-sm">{error}</p>
            </div>
          )}

          {/* Botão Analisar — 3D clay verde */}
          <div className="p-6">
            <button
              onClick={handleAnalyze}
              disabled={step === 'analyzing'}
              className="w-full py-5 rounded-full font-black text-white text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: step === 'analyzing'
                  ? 'linear-gradient(145deg, #6b7280, #4b5563)'
                  : 'linear-gradient(145deg, #22c55e, #16a34a)',
                boxShadow: step === 'analyzing'
                  ? 'none'
                  : '6px 6px 14px rgba(22,163,74,0.4), -3px -3px 8px rgba(134,239,172,0.5), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(21,128,61,0.4)',
              }}
            >
              {step === 'analyzing' ? (
                <><span className="material-symbols-outlined animate-spin">refresh</span>Analisando com IA...</>
              ) : (
                <><span className="material-symbols-outlined">biotech</span>Analisar Prato</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Etapa: RESULT ── */}
      {step === 'result' && result && (
        <div className="animate-slide-up space-y-5">
          {/* Card de resultado principal */}
          <div className="clay-effect rounded-[3rem] overflow-hidden"
            style={{ boxShadow: '8px 8px 20px rgba(163,177,198,0.5), -6px -6px 16px rgba(255,255,255,0.9)' }}>
            {imageDataUrl && (
              <img src={imageDataUrl} alt="Prato" className="w-full h-48 object-cover opacity-80" />
            )}
            <div className="p-8">
              <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">Resultado da Análise</p>

              {/* Calorias em destaque */}
              <div className="clay-effect rounded-3xl p-6 text-center mb-5"
                style={{ boxShadow: 'inset 4px 4px 12px rgba(163,177,198,0.3), inset -4px -4px 10px rgba(255,255,255,0.8)' }}>
                <span className="text-6xl font-black text-blue-500 leading-none">{result.calorias_totais}</span>
                <span className="text-slate-400 font-bold text-lg block mt-1">kcal</span>
              </div>

              {/* Peso estimado */}
              {result.peso_estimado_g > 0 && (
                <p className="text-center text-slate-400 font-bold text-sm mb-2">
                  <span className="material-symbols-outlined text-xs align-middle">scale</span> Peso estimado: ~{result.peso_estimado_g}g
                </p>
              )}

              {/* Macros — grid 3 cols */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: 'grain',       color: 'text-amber-400', label: 'Carbs',    value: result.carboidratos_g },
                  { icon: 'exercise',    color: 'text-red-400',   label: 'Proteínas',value: result.proteinas_g },
                  { icon: 'water_drop',  color: 'text-blue-400',  label: 'Gordura',  value: result.gordura_g },
                  { icon: 'icecream',    color: 'text-pink-400',  label: 'Açúcares', value: result.acucares_g },
                  { icon: 'grass',       color: 'text-green-500', label: 'Fibras',   value: result.fibras_g },
                ].map(m => (
                  <div key={m.label} className="clay-effect rounded-3xl p-4 text-center"
                    style={{ boxShadow: 'inset 3px 3px 8px rgba(163,177,198,0.3), inset -3px -3px 8px rgba(255,255,255,0.8)' }}>
                    <span className={`material-symbols-outlined ${m.color} text-xl mb-1 block`}>{m.icon}</span>
                    <p className="text-lg font-black text-slate-700">{m.value}g</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-4">
            <button onClick={handleReset}
              className="flex-1 py-4 rounded-full font-bold text-slate-500 transition-all active:scale-95"
              style={{ background: 'linear-gradient(145deg, #f8faff, #e2eaff)', boxShadow: '4px 4px 10px rgba(163,177,198,0.4), -3px -3px 8px rgba(255,255,255,0.9)' }}>
              Descartar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-4 rounded-full font-black text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                boxShadow: '6px 6px 14px rgba(37,99,235,0.4), -3px -3px 8px rgba(147,197,253,0.5), inset 0 2px 4px rgba(255,255,255,0.25)',
              }}
            >
              {saving ? <><span className="material-symbols-outlined animate-spin text-sm">refresh</span>Salvando</> : <><span className="material-symbols-outlined text-sm">save</span>Salvar</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Etapa: SAVED ── */}
      {step === 'saved' && result && (
        <div className="clay-effect rounded-[3rem] p-10 text-center animate-slide-up"
          style={{ boxShadow: '8px 8px 20px rgba(163,177,198,0.5), -6px -6px 16px rgba(255,255,255,0.9)' }}>
          <span className="material-symbols-outlined text-green-500 text-6xl mb-4 block">check_circle</span>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Refeição Salva!</h2>
          <p className="text-slate-500 font-semibold mb-2">
            <span className="text-blue-500 font-black text-xl">{result.calorias_totais} kcal</span> registradas no seu painel.
          </p>
          <p className="text-slate-400 font-bold text-sm mb-8">
            Carbs: {result.carboidratos_g}g · Prot: {result.proteinas_g}g · Gord: {result.gordura_g}g
          </p>
          <button
            onClick={handleReset}
            className="px-10 py-4 rounded-full font-black text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
              boxShadow: '6px 6px 14px rgba(37,99,235,0.4), -3px -3px 8px rgba(147,197,253,0.5), inset 0 2px 4px rgba(255,255,255,0.25)',
            }}
          >
            <span className="material-symbols-outlined align-middle mr-2 text-sm">add_a_photo</span>
            Nova Refeição
          </button>
        </div>
      )}
    </div>
  );
};

export default MealCapture;
