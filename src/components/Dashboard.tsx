import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceId, getTodayISO } from '../utils/device';

interface DashboardProps {
  userData: {
    meta_calorica: number;
    peso: number;
    altura: number;
    idade: number;
    data_expiracao: string;
    plano: string;
  };
  refreshKey?: number; // incrementar para forçar re-fetch
}

interface Refeicao {
  id: string;
  calorias_totais: number;
  peso_estimado_g: number;
  carboidratos_g: number;
  proteinas_g: number;
  gordura_g: number;
  acucares_g: number;
  fibras_g: number;
  created_at: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, refreshKey }) => {
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  const fetchRefeicoes = useCallback(async () => {
    setLoadingMeals(true);
    const userId = getDeviceId();
    const today = getTodayISO();

    const { data, error } = await supabase
      .from('refeicoes_diarias')
      .select('id, calorias_totais, peso_estimado_g, carboidratos_g, proteinas_g, gordura_g, acucares_g, fibras_g, created_at')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRefeicoes(data as Refeicao[]);
    }
    setLoadingMeals(false);
  }, []);

  useEffect(() => {
    fetchRefeicoes();
  }, [fetchRefeicoes, refreshKey]);

  const consumoDiario = refeicoes.reduce((sum, r) => sum + r.calorias_totais, 0);
  const totalCarbs    = refeicoes.reduce((sum, r) => sum + Number(r.carboidratos_g), 0);
  const totalProteinas= refeicoes.reduce((sum, r) => sum + Number(r.proteinas_g), 0);
  const totalGordura  = refeicoes.reduce((sum, r) => sum + Number(r.gordura_g), 0);
  const totalAcucares = refeicoes.reduce((sum, r) => sum + Number(r.acucares_g), 0);
  const totalFibras   = refeicoes.reduce((sum, r) => sum + Number(r.fibras_g), 0);
  const percentual = Math.min(100, Math.round((consumoDiario / userData.meta_calorica) * 100));
  const excesso = consumoDiario > userData.meta_calorica ? consumoDiario - userData.meta_calorica : 0;

  const barColor = percentual >= 100
    ? 'bg-red-400'
    : percentual >= 80
    ? 'bg-amber-400'
    : 'bg-blue-400';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Sombra claymorphica reutilizável
  const clayBox = {
    boxShadow: '8px 8px 20px rgba(163,177,198,0.5), -6px -6px 16px rgba(255,255,255,0.9), inset 0 1px 3px rgba(255,255,255,0.8)',
  };
  const clayInset = {
    boxShadow: 'inset 4px 4px 12px rgba(163,177,198,0.35), inset -4px -4px 10px rgba(255,255,255,0.85)',
  };

  return (
    <div className="container mx-auto px-4 md:px-8 animate-fade-in pb-24">

      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <span className="text-blue-500 font-black tracking-widest text-xs uppercase block mb-2">
            Painel de Controle
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800">
            Hoje, <span className="text-blue-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
          </h1>
        </div>
        <div className="clay-effect p-4 rounded-3xl flex items-center gap-2 hidden md:flex" style={clayBox}>
          <span className="material-symbols-outlined text-blue-400 text-xl">calendar_today</span>
          <span className="font-bold text-slate-500 text-sm">
            Plano até {new Date(userData.data_expiracao).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Card: Consumo Diário */}
        <div className="lg:col-span-2 rounded-[3rem] p-8 md:p-10 bg-blue-50 relative overflow-hidden transition-transform hover:-translate-y-1" style={clayBox}>
          <span className="text-xs text-blue-500 font-black tracking-widest uppercase block mb-6">Consumo Diário</span>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end mb-8">
            {/* Calorias consumidas */}
            <div className="rounded-3xl p-6 bg-blue-50 flex-1" style={clayInset}>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Consumido</p>
              <div className="flex items-end gap-2">
                <span className={`text-6xl font-black leading-none ${excesso > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {consumoDiario}
                </span>
                <span className="text-slate-400 font-bold text-lg mb-1">kcal</span>
              </div>
            </div>

            {/* Divider */}
            <span className="material-symbols-outlined text-slate-300 text-4xl hidden md:block mb-4">arrow_forward</span>

            {/* Meta */}
            <div className="rounded-3xl p-6 bg-blue-50 flex-1" style={clayInset}>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Meta do Dia</p>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-black text-slate-600 leading-none">{userData.meta_calorica}</span>
                <span className="text-slate-400 font-bold text-lg mb-1">kcal</span>
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="font-black text-slate-500 text-sm">{percentual}% da meta</span>
              {excesso > 0 && (
                <span className="text-red-500 font-black text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  +{excesso} kcal excesso
                </span>
              )}
            </div>
            <div className="h-5 bg-blue-100 rounded-full overflow-hidden" style={clayInset}>
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>

          {/* Macros totais — 5 campos */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Carboidratos', value: `${totalCarbs.toFixed(1)}g`,    icon: 'grain',       color: 'text-amber-500' },
              { label: 'Proteínas',   value: `${totalProteinas.toFixed(1)}g`, icon: 'exercise',    color: 'text-red-400'   },
              { label: 'Gordura',     value: `${totalGordura.toFixed(1)}g`,   icon: 'water_drop',  color: 'text-blue-400'  },
              { label: 'Açúcares',   value: `${totalAcucares.toFixed(1)}g`,  icon: 'icecream',    color: 'text-pink-400'  },
              { label: 'Fibras',      value: `${totalFibras.toFixed(1)}g`,    icon: 'grass',       color: 'text-green-500' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl p-3 bg-blue-50 flex flex-col items-center gap-1 text-center" style={clayInset}>
                <span className={`material-symbols-outlined ${item.color} text-lg`}>{item.icon}</span>
                <p className="font-black text-slate-700 text-sm">{item.value}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight leading-tight">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Glare decorativo */}
          <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Coluna secundária */}
        <div className="space-y-6">
          <div className="rounded-[3rem] p-8 bg-blue-50 transition-transform hover:-translate-y-1" style={clayBox}>
            <span className="material-symbols-outlined text-blue-500 text-4xl mb-4 block">scale</span>
            <h3 className="text-xl font-black text-slate-800 mb-1">Peso Corporal</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Métrica de Base</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-700">{userData.peso}</span>
              <span className="text-lg font-bold text-slate-400">kg</span>
            </div>
          </div>
          <div className="rounded-[3rem] p-8 bg-blue-50 transition-transform hover:-translate-y-1" style={clayBox}>
            <span className="material-symbols-outlined text-blue-500 text-4xl mb-4 block">local_fire_department</span>
            <h3 className="text-xl font-black text-slate-800 mb-1">Refeições Hoje</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Registros do Dia</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-blue-500">{refeicoes.length}</span>
              <span className="text-lg font-bold text-slate-400">refeições</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Histórico de Refeições de Hoje ── */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-5 flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-400">history</span>
          Histórico de Hoje
        </h2>

        {loadingMeals ? (
          <div className="flex items-center justify-center gap-3 py-12 text-blue-400">
            <span className="material-symbols-outlined animate-spin">refresh</span>
            <span className="font-bold">Carregando refeições...</span>
          </div>
        ) : refeicoes.length === 0 ? (
          <div className="rounded-[3rem] p-12 text-center bg-blue-50" style={clayBox}>
            <span className="material-symbols-outlined text-blue-200 text-6xl block mb-4">no_meals</span>
            <p className="text-slate-400 font-bold text-lg mb-1">Nenhuma refeição registrada hoje</p>
            <p className="text-slate-300 font-semibold text-sm">Use o "Cálculo Calórico" para registrar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {refeicoes.map((r, i) => (
              <div
                key={r.id}
                className="rounded-3xl p-5 bg-blue-50 flex items-center gap-5 animate-fade-in transition-transform hover:-translate-y-1"
                style={{ ...clayBox, animationDelay: `${i * 60}ms` }}
              >
                {/* Ícone numerado */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)', boxShadow: '4px 4px 10px rgba(37,99,235,0.35)' }}
                >
                  <span className="text-white font-black text-xl">{refeicoes.length - i}</span>
                </div>

                {/* Dados */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-700 text-base">Refeição {refeicoes.length - i}</span>
                    <span className="text-slate-400 font-bold text-xs">{formatTime(r.created_at)}</span>
                  </div>
                  {/* Mini macros bar */}
                  <div className="flex gap-3 flex-wrap">
                    <span className="text-blue-500 font-black text-sm">{r.calorias_totais} kcal</span>
                    <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">grain</span>{Number(r.carboidratos_g).toFixed(1)}g carbs
                    </span>
                    <span className="text-red-400 font-bold text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">exercise</span>{Number(r.proteinas_g).toFixed(1)}g prot
                    </span>
                  </div>
                </div>

                {/* Percentual individual */}
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-slate-500 text-sm">
                    {Math.round((r.calorias_totais / userData.meta_calorica) * 100)}%
                  </p>
                  <p className="text-slate-300 font-bold text-xs">da meta</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resetar plano */}
      <button
        onClick={() => { localStorage.removeItem('natofit_user'); localStorage.removeItem('natofit_device_id'); window.location.reload(); }}
        className="mt-12 text-slate-400 px-10 py-4 rounded-full font-bold hover:text-red-400 transition-colors text-sm"
        style={{ boxShadow: '4px 4px 10px rgba(163,177,198,0.3), -3px -3px 8px rgba(255,255,255,0.8)' }}
      >
        Resetar Perfil
      </button>
    </div>
  );
};

export default Dashboard;
