import React from 'react';

const FloatingFoods: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-40">
      {/* Laranja */}
      <div className="absolute top-[15%] left-[5%] animate-float-slow">
        <img 
          src="/floating_orange.png" 
          alt="Laranja" 
          className="w-24 h-24 object-contain animate-spin-random"
        />
      </div>

      {/* Brócolis */}
      <div className="absolute bottom-[20%] right-[10%] animate-float-medium">
        <img 
          src="/floating_broccoli.png" 
          alt="Brócolis" 
          className="w-28 h-28 object-contain animate-spin-reverse"
        />
      </div>

      {/* Outra Laranja menor */}
      <div className="absolute top-[60%] left-[80%] animate-float-fast">
        <img 
          src="/floating_orange.png" 
          alt="Laranja" 
          className="w-16 h-16 object-contain blur-[1px] opacity-60 animate-spin-random"
        />
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-50px) rotate(-10deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(15deg); }
        }
        @keyframes spin-random {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 12s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 6s ease-in-out infinite; }
        .animate-spin-random { animation: spin-random 25s linear infinite; }
        .animate-spin-reverse { animation: spin-random 30s linear infinite reverse; }
      `}</style>
    </div>
  );
};

export default FloatingFoods;
