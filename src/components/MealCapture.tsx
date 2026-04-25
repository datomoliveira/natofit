import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../utils/device';
import { animate, utils, waapi } from 'animejs';

const WORKER_URL = import.meta.env.VITE_WORKER_ANALYZE_FOOD || 'https://natofit.datomoliveira.workers.dev';

interface MealResult {
  calorias_totais: number;
  peso_estimado_g: number;
  carboidratos_g: number;
  proteinas_g: number;
  gordura_g: number;
  acucares_g: number;
  fibras_g: number;
  descricao_itens?: string;
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
  const [contextText, setContextText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [animatedCalories, setAnimatedCalories] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'result' && result) {
      const counter = { val: 0 };
      animate(counter, {
        val: result.calorias_totais,
        duration: 1500,
        easing: 'easeOutExpo',
        modifier: utils.round(0),
        onUpdate: () => setAnimatedCalories(counter.val)
      });

      // Animação com os exatos parâmetros (x, scale, skew e rotate)
      // Revertidos do estado bagunçado para o estado perfeito!
      animate('.macro-card', {
        opacity: [0, 1],
        x: ['15rem', 0],
        scale: [1.25, 1],
        skew: [-45, 0],
        rotate: ['1turn', '0turn'],
        duration: 1200,
        delay: utils.stagger(100, { start: 300 }),
        easing: 'easeOutElastic(1, .6)'
      });

    } else if (step === 'idle') {
      setAnimatedCalories(0);
    }
  }, [step, result]);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Reconhecimento de voz não é suportado pelo seu navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setContextText((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.start();
  };

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
    if (!imageDataUrl && !contextText.trim()) {
      setError("Forneça uma foto ou descreva a refeição.");
      return;
    }
    setStep('analyzing');
    setError(null);

    const base64 = imageDataUrl ? imageDataUrl.split(',')[1] : null;
    const mimeType = imageDataUrl ? imageDataUrl.split(';')[0].split(':')[1] : null;

    try {
      const payload: any = {};
      if (base64) {
        payload.image = base64;
        payload.mimeType = mimeType;
      }
      if (contextText.trim()) {
        payload.contextText = contextText.trim();
      }

      const resp = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: MealResult = await resp.json();

      if (data.error) {
        const errorMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : data.error;
        setError(`Ops! ${errorMsg}`);
        setStep('preview');
      } else {
        setResult(data);
        setStep('result');
      }
    } catch (err: any) {
      console.error('Erro na análise:', err);
      setError(`Os servidores estão superlotados no momento. Tente novamente em 1 minuto.`);
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
    setContextText('');
    setIsRecording(false);
  };

  // ── Variantes de UI por etapa ─────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">

      {/* Header */}
      <div className="text-center mb-10 mt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50/80 backdrop-blur mb-6 shadow-sm border border-blue-100/50">
          <span className="material-symbols-outlined text-blue-500 text-3xl">add_a_photo</span>
        </div>
        <h1 className="text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">Cálculo Calórico</h1>
        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-sm mx-auto">
          Fotografe seu prato e deixe a tecnologia calcular as calorias instantaneamente com precisão.
        </p>
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

          {/* Campo de Texto/Áudio sem imagem */}
          <div className="w-full mt-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block text-left">
               Ou descreva por texto / áudio
             </label>
             <div className="relative mb-4">
               <textarea 
                 value={contextText}
                 onChange={e => setContextText(e.target.value)}
                 placeholder="Ex: Comi meia porção de arroz com feijão..."
                 className="w-full bg-blue-50/50 backdrop-blur-sm rounded-2xl p-4 pr-14 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 resize-none h-24"
               />
               <button 
                 onClick={isRecording ? undefined : startRecording}
                 className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-500 hover:bg-blue-200'}`}
               >
                 <span className="material-symbols-outlined">{isRecording ? 'mic' : 'mic_none'}</span>
               </button>
             </div>
             
             {contextText.trim() && (
               <button
                 onClick={handleAnalyze}
                 className="w-full py-4 rounded-full font-black text-white text-lg flex items-center justify-center gap-2 transition-all active:scale-95 animate-fade-in"
                 style={{
                   background: 'linear-gradient(145deg, #22c55e, #16a34a)',
                   boxShadow: '6px 6px 14px rgba(22,163,74,0.4), inset 0 2px 4px rgba(255,255,255,0.25)',
                 }}
               >
                 <span className="material-symbols-outlined">biotech</span>Analisar Texto
               </button>
             )}
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

          {/* Detalhes Adicionais */}
          <div className="px-6 pt-6">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block text-left">
               Detalhes adicionais (Opcional)
             </label>
             <div className="relative">
               <textarea 
                 value={contextText}
                 onChange={e => setContextText(e.target.value)}
                 placeholder="Ex: O prato é fundo, tem uns 300g..."
                 disabled={step === 'analyzing'}
                 className="w-full bg-blue-50/50 backdrop-blur-sm rounded-2xl p-4 pr-14 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 resize-none h-20 disabled:opacity-60"
               />
               <button 
                 onClick={isRecording ? undefined : startRecording}
                 disabled={step === 'analyzing'}
                 className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md disabled:opacity-60 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-500 hover:bg-blue-200'}`}
               >
                 <span className="material-symbols-outlined">{isRecording ? 'mic' : 'mic_none'}</span>
               </button>
             </div>
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
                <><span className="material-symbols-outlined animate-spin">refresh</span>Calculando calorias...</>
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
              <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">Resultado da Análise</p>
              {result.descricao_itens && (
                <p className="text-slate-600 font-bold text-lg mb-4 leading-tight">
                  {result.descricao_itens}
                </p>
              )}

              {/* Calorias em destaque */}
              <div className="clay-effect rounded-3xl p-6 text-center mb-5"
                style={{ boxShadow: 'inset 4px 4px 12px rgba(163,177,198,0.3), inset -4px -4px 10px rgba(255,255,255,0.8)' }}>
                <span className="text-6xl font-black text-blue-500 leading-none">{animatedCalories}</span>
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
                  <div key={m.label} className="macro-card opacity-0 clay-effect rounded-3xl p-4 text-center"
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
            <span className="text-blue-500 font-black text-xl">{animatedCalories || result.calorias_totais} kcal</span> registradas no seu painel.
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
