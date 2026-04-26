import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Buscar dados do perfil na tabela 'profiles' se existir
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        onLoginSuccess(profile || { id: data.user.id, email: data.user.email });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/60 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
          <span className="material-symbols-outlined text-white text-3xl">lock</span>
        </div>
        <h2 className="text-3xl font-black text-slate-800">Bem-vindo</h2>
        <p className="text-slate-500 font-semibold mt-2">Acesse sua conta NatoFit</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/50 border border-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all outline-none font-semibold text-slate-700"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/50 border border-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all outline-none font-semibold text-slate-700"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-shake">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-[0_10px_25px_rgba(5,150,105,0.3)] hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin">sync</span>
          ) : (
            <>
              Entrar
              <span className="material-symbols-outlined">login</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-slate-400 font-bold text-sm uppercase tracking-widest py-2"
        >
          Voltar
        </button>
      </form>
    </div>
  );
};

export default Login;
