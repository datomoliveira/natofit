import React, { useState } from 'react';

interface CompensationSuggestionsProps {
  excessCalories: number;
  userWeight?: number;
  onDismiss: () => void;
}

interface Suggestion {
  icon: string;
  title: string;
  description: string;
  details: string[];
  color: string;
}

function generateSuggestions(excess: number, weight: number): Suggestion[] {
  // MET-based calorie estimates per minute
  const runningKcalPerMin = (9.8 * weight) / 60;  // ~MET 9.8
  const walkingKcalPerMin = (3.5 * weight) / 60;  // ~MET 3.5
  const strengthKcalPerMin = (5.0 * weight) / 60; // ~MET 5.0
  const cyclingKcalPerMin = (7.5 * weight) / 60;  // ~MET 7.5

  const runMins = Math.ceil(excess / runningKcalPerMin);
  const walkMins = Math.ceil(excess / walkingKcalPerMin);
  const strengthMins = Math.ceil((excess * 0.5) / strengthKcalPerMin);
  const cardioMins = Math.ceil((excess * 0.5) / cyclingKcalPerMin);
  const fastHours = Math.ceil(excess / (weight * 0.5)); // rough estimate

  return [
    {
      icon: 'self_improvement',
      title: 'Jejum Intermitente',
      description: `Estenda a janela de jejum para queimar as ${excess} kcal extras de forma passiva.`,
      details: [
        `Jejue por aproximadamente ${Math.min(fastHours + 4, 18)}h`,
        'Beba água, chá e café sem açúcar',
        'Queima de gordura acelera após 12h de jejum',
        `Próxima refeição: ${fastHours + 4}h após o jantar de hoje`
      ],
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: 'directions_run',
      title: 'Cardio Aeróbico',
      description: 'Queime o excesso com exercícios aeróbicos de alta eficiência.',
      details: [
        `Corrida leve: ${runMins} minutos`,
        `Caminhada rápida: ${walkMins} minutos`,
        `Ciclismo: ${Math.ceil(excess / cyclingKcalPerMin)} minutos`,
        'Intensidade: 65-75% da frequência cardíaca máxima'
      ],
      color: 'from-orange-400 to-red-500'
    },
    {
      icon: 'fitness_center',
      title: 'Força + Cardio (Mescla)',
      description: 'Combine musculação com cardio para queima máxima e preservação muscular.',
      details: [
        `${strengthMins} min de musculação (compostos: agachamento, supino, terra)`,
        `${cardioMins} min de cardio moderado após`,
        'Bônus: metabolismo acelerado por até 24h (afterburn)',
        'Sequência ideal: força primeiro, cardio depois'
      ],
      color: 'from-blue-400 to-blue-600'
    }
  ];
}

const CompensationSuggestions: React.FC<CompensationSuggestionsProps> = ({
  excessCalories,
  userWeight = 70,
  onDismiss
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const suggestions = generateSuggestions(excessCalories, userWeight);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="w-full max-w-lg bg-blue-50 rounded-[2.5rem] clay-effect p-8 animate-slide-up">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-red-400 text-2xl">warning</span>
              <span className="text-red-400 font-black uppercase text-xs tracking-widest">Meta Ultrapassada</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800">
              +{excessCalories} kcal
            </h2>
            <p className="text-slate-500 font-semibold mt-1">Escolha como compensar:</p>
          </div>
          <button
            onClick={onDismiss}
            className="clay-button w-10 h-10 rounded-full flex items-center justify-center text-slate-400"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`w-full text-left rounded-3xl p-6 transition-all duration-300 ${
                selected === i
                  ? 'bg-blue-500 text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)]'
                  : 'clay-effect hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center gap-4 mb-3">
                <span className={`material-symbols-outlined text-3xl ${selected === i ? 'text-white' : 'text-blue-500'}`}>
                  {s.icon}
                </span>
                <div>
                  <h3 className={`text-lg font-black ${selected === i ? 'text-white' : 'text-slate-800'}`}>{s.title}</h3>
                  <p className={`text-sm font-semibold ${selected === i ? 'text-blue-100' : 'text-slate-500'}`}>{s.description}</p>
                </div>
                <span className={`material-symbols-outlined ml-auto ${selected === i ? 'text-white' : 'text-slate-300'}`}>
                  {selected === i ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              {selected === i && (
                <ul className="space-y-2 mt-4 border-t border-white/20 pt-4">
                  {s.details.map((d, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm font-medium text-blue-50">
                      <span className="material-symbols-outlined text-sm mt-0.5 text-white">check_circle</span>
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 font-semibold mt-6">
          Estas são estimativas. Consulte um profissional de saúde.
        </p>
      </div>
    </div>
  );
};

export default CompensationSuggestions;
