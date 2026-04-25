import React, { useState, useEffect } from 'react';

const InstallPWA: React.FC = () => {
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPromptInstall(e);
      // Mostrar após 3 segundos para não ser intrusivo
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (!promptInstall) return;
    promptInstall.prompt();
    promptInstall.userChoice.then((choice: any) => {
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-slide-up">
      <div 
        className="clay-effect rounded-[2.5rem] p-6 bg-blue-50 border border-white/50 flex items-center gap-4"
        style={{ boxShadow: '10px 10px 25px rgba(163,177,198,0.6), -8px -8px 20px rgba(255,255,255,0.9), inset 0 2px 4px rgba(255,255,255,0.5)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <img src="/icon-192.png" alt="NatoFit" className="w-10 h-10 object-contain" />
        </div>
        
        <div className="flex-1">
          <h4 className="text-slate-800 font-black text-sm leading-tight">Instalar NatoFit</h4>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Acesso rápido na tela inicial</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setVisible(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <button 
            onClick={handleInstall}
            className="px-6 py-3 rounded-full font-black text-xs text-white transition-all active:scale-95"
            style={{ 
              background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
              boxShadow: '4px 4px 10px rgba(37,99,235,0.3), inset 0 1px 2px rgba(255,255,255,0.3)' 
            }}
          >
            BAIXAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
