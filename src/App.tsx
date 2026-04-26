import { useState, useEffect } from 'react';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard';
import MealCapture from './components/MealCapture';
import InstallPWA from './components/InstallPWA';
import IntroScreen from './components/IntroScreen';
import FloatingFoods from './components/FloatingFoods';

type View = 'landing' | 'tracker' | 'create-plan' | 'dashboard';

function App() {
  const [view, setView] = useState<View>('landing');
  const [userData, setUserData] = useState<any>(null);
  const [dashRefreshKey, setDashRefreshKey] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('natofit_user');
    if (saved) {
      setUserData(JSON.parse(saved));
    }
  }, []);

  const handleComplete = (data: any) => {
    setUserData(data);
    localStorage.setItem('natofit_user', JSON.stringify(data));
    setView('dashboard');
  };

  // Chamado quando uma refeição é salva no MealCapture
  const handleMealSaved = () => {
    setDashRefreshKey(k => k + 1);
  };

  return (
    <div className="bg-[#f0fdf4] text-slate-800 font-sans w-full relative min-h-screen">
      {/* Background Animated Foods */}
      <FloatingFoods />

      {/* Intro Screen */}
      {showIntro && <IntroScreen onComplete={() => setShowIntro(false)} />}

      {/* Main Content (faded in after intro starts moving) */}
      <div className={`transition-opacity duration-1000 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-2xl fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-8 py-4"
          style={{ boxShadow: '0 4px 20px rgba(6,95,70,0.05)' }}>
          <button onClick={() => setView('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">bolt</span>
          <span className="text-2xl font-black tracking-wide text-emerald-600">NatoFit</span>
        </button>

        <nav className="hidden md:flex gap-2 items-center">
          {[
            { label: 'Cálculo Calórico', v: 'tracker' as View, icon: 'add_a_photo' },
            { label: 'Criar Plano', v: 'create-plan' as View, icon: 'rocket_launch' },
          ].map(item => (
            <button key={item.v}
              onClick={() => item.v === 'dashboard' && !userData ? setView('create-plan') : setView(item.v)}
              className={`font-bold px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all ${
                view === item.v ? 'bg-emerald-100 text-emerald-600' : 'text-slate-500 hover:text-emerald-500'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={() => setView('tracker')}
          className="rounded-full px-5 py-2 font-bold text-sm flex items-center gap-2 text-white"
          style={{ background: 'linear-gradient(145deg,#059669,#047857)', boxShadow: '4px 4px 10px rgba(5,150,105,0.35)' }}>
          <span className="material-symbols-outlined text-sm">add_a_photo</span>
          <span className="hidden md:inline">Analisar Refeição</span>
        </button>
      </header>

      <main className="pt-20 pb-32">
        {/* ── Cálculo Calórico (Fase 2 MealCapture) ── */}
        {view === 'tracker' && (
          <div className="py-6">
            <MealCapture onMealSaved={() => { handleMealSaved(); }} />
          </div>
        )}

        {/* ── Criar Plano ── */}
        {view === 'create-plan' && (
          <div className="py-10">
            <ProfileForm onComplete={handleComplete} />
          </div>
        )}

        {/* ── Dashboard ── */}
        {view === 'dashboard' && userData && (
          <div className="py-8">
            <Dashboard userData={userData} refreshKey={dashRefreshKey} />
          </div>
        )}

        {/* ── Landing Page ── */}
        {view === 'landing' && (
          <>
            {/* Hero */}
            <section className="relative min-h-[680px] flex items-center overflow-hidden bg-blue-50">
              <div className="absolute inset-0 z-0 opacity-20 p-8">
                <div className="w-full h-full rounded-3xl overflow-hidden"
                  style={{ boxShadow: '8px 8px 20px rgba(163,177,198,0.5), -6px -6px 16px rgba(255,255,255,0.9)' }}>
                  <img
                    className="w-full h-full object-cover grayscale"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGEPzIZQKsof32BcUdYS5nDqdP0PEmleue3_zgjelnTKC1Qi6ykhTXd-nt1YJ9kmylJ7SEFMluW4HJ3-pyAC96bEWFhKpge_BNrODPRwSX72J1L1hnu65MB3G8RTCTlza-loLOyD41Svv7tu5P3m8mrRXNG-6I74HxdAS1JY_S2HPgL66vWdnD4QYFYMMhxLdOIG2jAPhHjkstfEvgjHz2N7dLSiPMp6b6koo3z9iKNf0jZzNlVHxwQD1r1tqGS8BsXO0pbBL1wls"
                    alt="Atleta treinando"
                  />
                </div>
              </div>

              <div className="container mx-auto px-8 relative z-20">
                <div className="max-w-3xl p-10 rounded-[3rem] bg-blue-50/80 backdrop-blur-md"
                  style={{ boxShadow: '12px 12px 28px rgba(163,177,198,0.45), -8px -8px 20px rgba(255,255,255,0.85)' }}>
                  <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter mb-6 text-slate-800">
                    Controle <br/><span className="text-blue-500">Calórico</span><br/>Inteligente
                  </h1>
                  <p className="text-lg text-slate-600 max-w-xl mb-10 border-l-4 border-blue-300 pl-5 py-2 font-semibold leading-relaxed">
                    Fotografe qualquer refeição. Identifique calorias, carboidratos e proteínas em segundos.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => setView('tracker')}
                      className="px-10 py-5 rounded-full font-black text-lg text-white flex items-center gap-3 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(145deg,#3b82f6,#2563eb)', boxShadow: '8px 8px 20px rgba(37,99,235,0.4), inset 0 2px 4px rgba(255,255,255,0.25)' }}>
                      <span className="material-symbols-outlined">add_a_photo</span>
                      Cálculo Calórico
                    </button>
                    <button onClick={() => setView('create-plan')}
                      className="px-10 py-5 rounded-full font-black text-lg text-slate-600 flex items-center gap-3 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(145deg,#f8faff,#e2eaff)', boxShadow: '6px 6px 14px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.9)' }}>
                      <span className="material-symbols-outlined text-blue-400">rocket_launch</span>
                      Criar Plano
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Bento */}
            <section className="py-20 bg-blue-50">
              <div className="container mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: 'add_a_photo', title: 'Foto → Calorias', desc: 'Tecnologia de visão analisa qualquer prato e retorna calorias + macros instantaneamente.', v: 'tracker' as View },
                    { icon: 'biotech', title: 'Laudo de Bioimpedância', desc: 'Envie o laudo e extraia gordura, massa magra e TMB automaticamente.', v: 'create-plan' as View },
                  ].map(f => (
                    <div key={f.v}
                      onClick={() => f.v === 'dashboard' && !userData ? setView('create-plan') : setView(f.v)}
                      className="group rounded-[3rem] p-10 bg-blue-50 cursor-pointer transition-transform hover:-translate-y-2"
                      style={{ boxShadow: '8px 8px 20px rgba(163,177,198,0.45), -6px -6px 16px rgba(255,255,255,0.85)' }}>
                      <span className="material-symbols-outlined text-blue-500 text-5xl mb-5 block">{f.icon}</span>
                      <h3 className="text-2xl font-black text-slate-800 mb-3">{f.title}</h3>
                      <p className="text-slate-500 font-semibold leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-blue-50">
              <div className="container mx-auto px-8 text-center">
                <div className="max-w-3xl mx-auto rounded-[3rem] p-14 bg-blue-50"
                  style={{ boxShadow: '12px 12px 28px rgba(163,177,198,0.45), -8px -8px 20px rgba(255,255,255,0.85)' }}>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6">Comece Agora</h2>
                  <p className="text-slate-500 font-semibold text-lg mb-10 max-w-xl mx-auto">
                    Tire sua primeira foto e descubra exatamente o que está consumindo.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button onClick={() => setView('tracker')}
                      className="px-12 py-5 rounded-full font-black text-xl text-white flex items-center gap-3 active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(145deg,#3b82f6,#2563eb)', boxShadow: '8px 8px 20px rgba(37,99,235,0.4)' }}>
                      <span className="material-symbols-outlined">add_a_photo</span>
                      Cálculo Calórico
                    </button>
                    <button onClick={() => setView('create-plan')}
                      className="px-12 py-5 rounded-full font-black text-xl text-slate-600 flex items-center gap-3 active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(145deg,#f8faff,#e2eaff)', boxShadow: '6px 6px 14px rgba(163,177,198,0.5)' }}>
                      <span className="material-symbols-outlined text-blue-400">person_add</span>
                      Criar Plano
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-blue-50/90 backdrop-blur-2xl flex justify-around items-center px-4 py-3 md:hidden"
        style={{ boxShadow: '0 -4px 20px rgba(163,177,198,0.25)' }}>
        {[
          { icon: 'home', label: 'Início', v: 'landing' as View },
          { icon: 'add_a_photo', label: 'Calorias', v: 'tracker' as View },
          { icon: 'rocket_launch', label: 'Plano', v: 'create-plan' as View },
        ].map(item => (
          <button key={item.v}
            onClick={() => item.v === 'dashboard' && !userData ? setView('create-plan') : setView(item.v)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
              view === item.v ? 'text-blue-600' : 'text-slate-400'
            }`}>
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Convite para Instalar PWA */}
      <InstallPWA />
      </div>
    </div>
  );
}

export default App;
