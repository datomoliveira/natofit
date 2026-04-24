import React, { useState, useRef, useCallback } from 'react';
import CompensationSuggestions from './CompensationSuggestions';

const WORKER_ANALYZE_FOOD = import.meta.env.VITE_WORKER_ANALYZE_FOOD || 'http://localhost:8787';
const DEFAULT_GOAL = 2000;
const TODAY_KEY = `natofit_meals_${new Date().toISOString().split('T')[0]}`;

interface FoodItem {
  id: string;
  name: string;
  portionGrams: number;
  calories: number;
  imagePreview: string;
  time: string;
}

interface AnalysisResult {
  foods: { name: string; portionGrams: number; calories: number }[];
  totalCalories: number;
  confidence: string;
  notes?: string;
  error?: string;
}

const CalorieTracker: React.FC = () => {
  const [meals, setMeals] = useState<FoodItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(TODAY_KEY) || '[]'); }
    catch { return []; }
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const [showCompensation, setShowCompensation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user goal from saved profile
  const userProfile = (() => {
    try { return JSON.parse(localStorage.getItem('natofit_user') || '{}'); }
    catch { return {}; }
  })();
  const dailyGoal: number = userProfile.meta_calorica || DEFAULT_GOAL;
  const userWeight: number = userProfile.peso || 70;

  const totalConsumed = meals.reduce((sum, m) => sum + m.calories, 0);
  const excess = totalConsumed - dailyGoal;
  const progressPct = Math.min((totalConsumed / dailyGoal) * 100, 100);
  const isOverGoal = totalConsumed > dailyGoal;

  const saveMeals = (updated: FoodItem[]) => {
    localStorage.setItem(TODAY_KEY, JSON.stringify(updated));
    setMeals(updated);
  };

  const handleImageSelect = useCallback((file: File) => {
    setError(null);
    setLastResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!preview) return;
    setAnalyzing(true);
    setError(null);

    try {
      // Extract base64 from data URL
      const base64 = preview.split(',')[1];
      const mimeType = preview.split(';')[0].split(':')[1];

      const response = await fetch(WORKER_ANALYZE_FOOD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType })
      });

      const result: AnalysisResult = await response.json();

      if (result.error) {
        setError(result.error);
        setAnalyzing(false);
        return;
      }

      setLastResult(result);
    } catch (err) {
      setError('Erro ao conectar com o servidor. Verifique sua conexão.');
    } finally {
      setAnalyzing(false);
    }
  }, [preview]);

  const confirmMeal = useCallback(() => {
    if (!lastResult || !preview) return;

    const newMeal: FoodItem = {
      id: Date.now().toString(),
      name: lastResult.foods.map(f => f.name).join(', '),
      portionGrams: lastResult.foods.reduce((s, f) => s + f.portionGrams, 0),
      calories: lastResult.totalCalories,
      imagePreview: preview,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...meals, newMeal];
    saveMeals(updated);

    // Reset flow
    setPreview(null);
    setLastResult(null);

    // Show compensation if over goal
    const newTotal = updated.reduce((s, m) => s + m.calories, 0);
    if (newTotal > dailyGoal) {
      setTimeout(() => setShowCompensation(true), 500);
    }
  }, [lastResult, preview, meals, dailyGoal]);

  const removeMeal = (id: string) => {
    saveMeals(meals.filter(m => m.id !== id));
    setShowCompensation(false);
  };

  const resetDay = () => {
    saveMeals([]);
    setShowCompensation(false);
    setPreview(null);
    setLastResult(null);
  };

  return (
    <div className="container mx-auto px-6 pb-24 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="py-8 flex justify-between items-center">
        <div>
          <span className="text-blue-500 font-black uppercase text-xs tracking-widest block mb-1">Controle Calórico</span>
          <h1 className="text-4xl font-black text-slate-800">Hoje</h1>
          <p className="text-slate-400 font-semibold text-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={resetDay} className="clay-button text-slate-400 px-4 py-2 rounded-full text-xs font-bold">
          Zerar dia
        </button>
      </div>

      {/* Daily Progress Card */}
      <div className={`clay-effect rounded-[2.5rem] p-8 mb-8 ${isOverGoal ? 'border-2 border-red-200' : ''}`}>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Total Consumido</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-black ${isOverGoal ? 'text-red-500' : 'text-blue-500'}`}>
                {totalConsumed}
              </span>
              <span className="text-slate-400 font-bold text-lg">/ {dailyGoal} kcal</span>
            </div>
          </div>
          {isOverGoal && (
            <button
              onClick={() => setShowCompensation(true)}
              className="bg-red-100 text-red-500 px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">warning</span>
              +{excess} kcal
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-4 bg-blue-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isOverGoal ? 'bg-red-400' : 'bg-blue-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs font-bold text-slate-400">0 kcal</span>
          {!isOverGoal && (
            <span className="text-xs font-bold text-blue-400">{dailyGoal - totalConsumed} kcal restantes</span>
          )}
          <span className="text-xs font-bold text-slate-400">{dailyGoal} kcal</span>
        </div>
      </div>

      {/* Image Upload Zone */}
      <div className="mb-8">
        {!preview ? (
          <div className="clay-effect rounded-[2.5rem] p-8 text-center">
            <span className="material-symbols-outlined text-blue-400 text-6xl mb-4 block">add_a_photo</span>
            <h3 className="text-xl font-black text-slate-700 mb-2">Registrar Refeição</h3>
            <p className="text-slate-400 font-semibold mb-6 text-sm">Tire uma foto ou faça upload da sua refeição</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                className="clay-button text-blue-600 px-8 py-4 rounded-full font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined">camera_alt</span>
                Câmera
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
                className="clay-button text-slate-600 px-8 py-4 rounded-full font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined">upload</span>
                Upload
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
                e.target.value = '';
              }}
            />
          </div>
        ) : (
          <div className="clay-effect rounded-[2.5rem] p-6">
            {/* Image Preview */}
            <div className="relative rounded-3xl overflow-hidden mb-6" style={{ maxHeight: 260 }}>
              <img src={preview} alt="Refeição" className="w-full object-cover" style={{ maxHeight: 260 }} />
            </div>

            {/* Analysis Result */}
            {lastResult && !lastResult.error && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="font-black text-slate-700">Análise Completa</span>
                  <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold ml-auto">
                    {lastResult.confidence} confiança
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {lastResult.foods.map((f, i) => (
                    <div key={i} className="flex justify-between items-center clay-effect rounded-2xl px-5 py-3">
                      <span className="font-bold text-slate-700 text-sm">{f.name}</span>
                      <div className="text-right">
                        <span className="text-blue-500 font-black">{f.calories} kcal</span>
                        <span className="text-slate-400 text-xs font-bold block">{f.portionGrams}g</span>
                      </div>
                    </div>
                  ))}
                </div>
                {lastResult.notes && (
                  <p className="text-xs text-slate-400 font-semibold italic mb-4">{lastResult.notes}</p>
                )}
                <div className="clay-effect rounded-2xl px-5 py-4 flex justify-between items-center">
                  <span className="font-black text-slate-700">Total da refeição</span>
                  <span className="text-2xl font-black text-blue-500">{lastResult.totalCalories} kcal</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-400">error</span>
                <p className="text-red-500 font-bold text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setPreview(null); setLastResult(null); setError(null); }}
                className="clay-button text-slate-500 flex-1 py-4 rounded-2xl font-bold"
              >
                Cancelar
              </button>
              {!lastResult ? (
                <button
                  onClick={analyzeImage}
                  disabled={analyzing}
                  className="bg-blue-500 text-white flex-[2] py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(59,130,246,0.3)] hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">psychology</span>
                      Analisar com IA
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={confirmMeal}
                  className="bg-green-500 text-white flex-[2] py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(34,197,94,0.3)] hover:bg-green-600 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Adicionar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Meal History */}
      {meals.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-slate-600 mb-4 uppercase tracking-widest text-xs">
            Refeições de Hoje ({meals.length})
          </h3>
          <div className="space-y-4">
            {meals.map((meal) => (
              <div key={meal.id} className="clay-effect rounded-3xl p-5 flex items-center gap-5">
                <img
                  src={meal.imagePreview}
                  alt={meal.name}
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-700 text-sm truncate">{meal.name}</p>
                  <p className="text-slate-400 text-xs font-bold">{meal.time} • {meal.portionGrams}g</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-blue-500">{meal.calories} kcal</p>
                  <button onClick={() => removeMeal(meal.id)} className="text-slate-300 hover:text-red-400 transition-colors mt-1">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meals.length === 0 && !preview && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-slate-200 text-8xl block mb-4">restaurant</span>
          <p className="text-slate-300 font-bold">Nenhuma refeição registrada hoje</p>
        </div>
      )}

      {/* Compensation Modal */}
      {showCompensation && (
        <CompensationSuggestions
          excessCalories={excess}
          userWeight={userWeight}
          onDismiss={() => setShowCompensation(false)}
        />
      )}
    </div>
  );
};

export default CalorieTracker;
