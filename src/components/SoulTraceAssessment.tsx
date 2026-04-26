import React, { useState, useEffect } from 'react';

interface SoulTraceAssessmentProps {
  onComplete: (profile: any) => void;
  onCancel: () => void;
}

const SoulTraceAssessment: React.FC<SoulTraceAssessmentProps> = ({ onComplete, onCancel }) => {
  const [answers, setAnswers] = useState<{ questionId: number; score: number }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{ id: number; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ answered: 0, total: 24 });
  const [error, setError] = useState<string | null>(null);

  const fetchNextQuestion = async (currentAnswers: { questionId: number; score: number }[]) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Solicitando próxima questão ao SoulTrace...', { answersCount: currentAnswers.length });
      
      // Usando o AllOrigins como proxy de produção mais estável
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = 'https://soultrace.app/api/agent';
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: currentAnswers }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta da API SoulTrace:', response.status, errorText);
        throw new Error(`Erro na API (${response.status}). Verifique sua conexão.`);
      }

      const data = await response.json();
      console.log('Resposta SoulTrace recebida:', data.status);

      if (data.status === 'complete') {
        onComplete(data);
      } else {
        setCurrentQuestion(data.question);
        setProgress(data.progress);
      }
    } catch (err: any) {
      console.error('Falha ao carregar SoulTrace:', err);
      setError(err.message || 'Houve um problema ao carregar o questionário. Verifique sua conexão ou tente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (score: number) => {
    if (!currentQuestion) return;
    const newAnswers = [...answers, { questionId: currentQuestion.id, score }];
    setAnswers(newAnswers);
    fetchNextQuestion(newAnswers);
  };

  const getFitnessContext = () => {
    return "Como essa afirmação se aplica à sua rotina de treinos e dieta?";
  };

  if (loading && !currentQuestion) {
    return (
      <div className="p-8 text-center bg-blue-50/90 rounded-[2.5rem] clay-effect animate-pulse">
        <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin mb-4">sync</span>
        <p className="text-slate-600 font-bold tracking-widest uppercase text-sm">Analisando Perfil...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-blue-50/90 rounded-[2.5rem] clay-effect">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">
          Perfil de Treino
        </h3>
        <span className="text-blue-500 font-bold text-sm bg-white px-3 py-1 rounded-full clay-effect">
          {progress.answered} / {progress.total}
        </span>
      </div>

      {error ? (
        <div className="text-red-500 mb-6 text-sm font-medium p-4 bg-red-50 rounded-xl border border-red-100">
          <span className="material-symbols-outlined text-xs mr-2">error</span>
          {error}
        </div>
      ) : (
        currentQuestion && (
          <div className="mb-8 animate-fade-in">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-3">
              {getFitnessContext()}
            </p>
            <div className="bg-white p-6 rounded-2xl clay-effect mb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h4 className="text-xl font-light text-slate-800 italic">
                "{currentQuestion.text}"
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 mt-6">
              {[
                { score: 1, label: 'Discordo Totalmente', color: 'bg-red-100 hover:bg-red-200 text-red-700' },
                { score: 2, label: 'Discordo', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
                { score: 3, label: 'Discordo Levemente', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' },
                { score: 4, label: 'Neutro', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700' },
                { score: 5, label: 'Concordo Levemente', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
                { score: 6, label: 'Concordo', color: 'bg-green-100 hover:bg-green-200 text-green-700' },
                { score: 7, label: 'Concordo Totalmente', color: 'bg-teal-100 hover:bg-teal-200 text-teal-700' },
              ].map((opt) => (
                <button
                  key={opt.score}
                  onClick={() => handleAnswer(opt.score)}
                  disabled={loading}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${opt.color} ${loading ? 'opacity-50 cursor-not-allowed' : 'clay-button transform hover:scale-105 active:scale-95'}`}
                  title={opt.label}
                >
                  <span className="text-lg font-black">{opt.score}</span>
                  <span className="text-[10px] uppercase tracking-tighter mt-1 font-bold text-center leading-tight">
                    {opt.label.split(' ')[0]}<br/>{opt.label.split(' ')[1] || ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      )}

      <div className="flex justify-center mt-6">
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest underline decoration-slate-300 underline-offset-4"
        >
          Cancelar Teste
        </button>
      </div>
    </div>
  );
};

export default SoulTraceAssessment;
