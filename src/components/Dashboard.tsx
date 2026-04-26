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
      <div className="mb-12 md:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 mt-4">
        <div className="max-w-2xl">
          <span className="font-bold text-slate-800 text-sm mb-2 md:mb-4 block">_Painel de Controle</span>
          <h1 className="text-5xl md:text-7xl font-light text-slate-900 leading-tight tracking-tighter">
            Hoje, <span className="font-medium text-emerald-600">{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}.</span>
          </h1>
        </div>
        <div className="lg:max-w-xs lg:pb-2 flex flex-col gap-4">
          <p className="text-slate-600 font-medium text-[10px] md:text-xs uppercase tracking-widest leading-loose">
            ACOMPANHAMENTO DIÁRIO DO SEU CONSUMO CALÓRICO, MACRONUTRIENTES E PROGRESSO RUMO AO SEU OBJETIVO.
          </p>
          <div className="clay-effect p-3 px-5 rounded-full flex items-center gap-2 bg-emerald-50/50 w-fit" style={clayBox}>
            <span className="material-symbols-outlined text-emerald-400 text-lg">calendar_today</span>
            <span className="font-bold text-slate-500 text-[10px] md:text-xs uppercase tracking-widest">
              Até {new Date(userData.data_expiracao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Calendário Semanal */}
      <div className="mb-10 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {(() => {
          const now = new Date();
          // Ajuste para o fuso do Brasil (Brasília)
          const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
          
          const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - dayOfWeek); // Sempre começa no Domingo

          return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const isToday = date.toDateString() === today.toDateString();
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            const dayNum = date.getDate();

            return (
              <div
                key={i}
                className={`flex-shrink-0 w-16 md:w-20 p-4 rounded-3xl flex flex-col items-center gap-1 transition-all ${
                  isToday 
                    ? 'bg-emerald-600 text-white shadow-[0_10px_20px_rgba(5,150,105,0.3)] scale-105 z-10' 
                    : 'bg-emerald-50/50 text-slate-500'
                }`}
                style={isToday ? {} : clayBox}
              >
                <span className={`text-[10px] uppercase font-black tracking-widest ${isToday ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {dayName}
                </span>
                <span className="text-xl md:text-2xl font-black">
                  {dayNum}
                </span>
              </div>
            );
          });
        })()}
      </div>

      {/* PROMO CARD - ESTILO NUTRIA */}
      <div className="mb-10 rounded-[3rem] p-8 md:p-12 bg-emerald-600 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl" style={clayBox}>
        <div className="flex-1 z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-none uppercase">
            Sentindo-se <br/> Melhor?
          </h2>
          <p className="text-emerald-100 font-medium text-lg max-w-sm mb-6">
            Mantenha sua vida saudável com boa alimentação e o tracking preciso da NatoFit.
          </p>
          <button className="bg-white text-emerald-700 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs clay-button hover:scale-105 active:scale-95 transition-all">
            Ver Recomendações
          </button>
        </div>
        <div className="relative w-full md:w-[400px] h-[300px] md:h-[350px] flex-shrink-0">
          <div className="absolute inset-0 bg-white/10 rounded-[3rem] backdrop-blur-sm -rotate-3" />
          <img 
            src="/promo_salad.png" 
            alt="Salada Saudável" 
            className="absolute inset-0 w-full h-full object-cover rounded-[3rem] shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
          />
        </div>
        {/* Decorativos */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-800/20 rounded-full blur-2xl -ml-16 -mb-16" />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Card: Consumo Diário */}
        <div className="lg:col-span-2 rounded-[3rem] p-8 md:p-10 bg-emerald-50/50 relative overflow-hidden transition-transform hover:-translate-y-1" style={clayBox}>
          <span className="text-xs text-emerald-600 font-black tracking-widest uppercase block mb-6">Consumo Diário</span>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end mb-8">
            {/* Calorias consumidas */}
            <div className="rounded-3xl p-6 bg-white/50 flex-1" style={clayInset}>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Consumido</p>
              <div className="flex items-end gap-2">
                <span className={`text-6xl font-black leading-none ${excesso > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {consumoDiario}
                </span>
                <span className="text-slate-400 font-bold text-lg mb-1">kcal</span>
              </div>
            </div>

            {/* Divider */}
            <span className="material-symbols-outlined text-emerald-200 text-4xl hidden md:block mb-4">arrow_forward</span>

            {/* Meta */}
            <div className="rounded-3xl p-6 bg-white/50 flex-1" style={clayInset}>
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
            <div className="h-5 bg-emerald-100/50 rounded-full overflow-hidden" style={clayInset}>
              <div
                className={`h-full ${percentual >= 100 ? 'bg-red-400' : 'bg-emerald-500'} rounded-full transition-all duration-700`}
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>

          {/* Macros totais — 5 campos */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Carboidratos', value: `${totalCarbs.toFixed(1)}g`,    icon: 'grain',       color: 'text-amber-500' },
              { label: 'Proteínas',   value: `${totalProteinas.toFixed(1)}g`, icon: 'exercise',    color: 'text-red-400'   },
              { label: 'Gordura',     value: `${totalGordura.toFixed(1)}g`,   icon: 'water_drop',  color: 'text-emerald-400'  },
              { label: 'Açúcares',   value: `${totalAcucares.toFixed(1)}g`,  icon: 'icecream',    color: 'text-pink-400'  },
              { label: 'Fibras',      value: `${totalFibras.toFixed(1)}g`,    icon: 'grass',       color: 'text-emerald-600' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl p-3 bg-white/50 flex flex-col items-center gap-1 text-center" style={clayInset}>
                <span className={`material-symbols-outlined ${item.color} text-lg`}>{item.icon}</span>
                <p className="font-black text-slate-700 text-sm">{item.value}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight leading-tight">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Glare decorativo */}
          <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Coluna secundária */}
        <div className="space-y-6">
          <div className="rounded-[3rem] p-8 bg-emerald-50/50 transition-transform hover:-translate-y-1" style={clayBox}>
            <span className="material-symbols-outlined text-emerald-600 text-4xl mb-4 block">scale</span>
            <h3 className="text-xl font-black text-slate-800 mb-1">Peso Corporal</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Métrica de Base</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-700">{userData.peso}</span>
              <span className="text-lg font-bold text-slate-400">kg</span>
            </div>
          </div>
          <div className="rounded-[3rem] p-8 bg-emerald-600 transition-transform hover:-translate-y-1" style={clayBox}>
            <span className="material-symbols-outlined text-white text-4xl mb-4 block">local_fire_department</span>
            <h3 className="text-xl font-black text-white mb-1">Refeições Hoje</h3>
            <p className="text-emerald-100 font-bold text-xs uppercase tracking-wider mb-3">Registros do Dia</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{refeicoes.length}</span>
              <span className="text-lg font-bold text-emerald-100">refeições</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Histórico de Refeições de Hoje ── */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-5 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-500">history</span>
          Histórico de Hoje
        </h2>

        {loadingMeals ? (
          <div className="flex items-center justify-center gap-3 py-12 text-emerald-500">
            <span className="material-symbols-outlined animate-spin">refresh</span>
            <span className="font-bold">Carregando refeições...</span>
          </div>
        ) : refeicoes.length === 0 ? (
          <div className="rounded-[3rem] p-12 text-center bg-white/50 shadow-inner" style={clayInset}>
            <span className="material-symbols-outlined text-emerald-200 text-6xl block mb-4">no_meals</span>
            <p className="text-slate-400 font-bold text-lg mb-1">Nenhuma refeição registrada hoje</p>
            <p className="text-slate-300 font-semibold text-sm">Use o "Cálculo Calórico" para registrar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {refeicoes.map((r, i) => (
              <div
                key={r.id}
                className="rounded-3xl p-5 bg-white flex items-center gap-5 animate-fade-in transition-transform hover:-translate-y-1 shadow-sm"
                style={{ ...clayBox, animationDelay: `${i * 60}ms` }}
              >
                {/* Ícone numerado */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(145deg, #059669, #047857)', boxShadow: '4px 4px 10px rgba(4,120,87,0.3)' }}
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
