import React from 'react';

const FoodConveyor: React.FC = () => {
  // Lista de imagens geradas
  const dishes = [
    '/dish1.png',
    '/dish2.png',
    '/dish3.png',
    '/dish4.png',
    '/dish5.png',
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-emerald-50/30">
      
      <div className="absolute inset-0 z-10 backdrop-blur-[8px] bg-white/40 mask-radial-fade"></div>

      <div className="absolute inset-0 transform -rotate-[15deg] scale-150 flex flex-col justify-center gap-16 opacity-60">
        
        {/* Esteira 1: Direita para Esquerda (Muito lenta e fluida) */}
        <div className="flex w-max animate-conveyor-left">
          {/* Para um loop perfeito, precisamos de 2 grupos exatos lado a lado */}
          {[...dishes, ...dishes].map((dish, i) => (
            <div key={`row1-${i}`} className="flex-shrink-0 w-48 h-48 mx-8 rounded-full shadow-2xl overflow-hidden bg-white/50 border-4 border-white/40">
              <img src={dish} alt="Healthy Dish" className="w-full h-full object-cover animate-spin-slow" />
            </div>
          ))}
        </div>

        {/* Esteira 2: Esquerda para Direita (Ainda mais lenta) */}
        <div className="flex w-max animate-conveyor-right -ml-[50vw]">
          {[...dishes, ...dishes].reverse().map((dish, i) => (
            <div key={`row2-${i}`} className="flex-shrink-0 w-64 h-64 mx-12 rounded-full shadow-2xl overflow-hidden bg-white/50 border-4 border-white/40">
              <img src={dish} alt="Healthy Dish" className="w-full h-full object-cover animate-spin-reverse-slow" />
            </div>
          ))}
        </div>

      </div>

      <style>{`
        /* Animações com duração super estendida para lentidão fluida */
        @keyframes conveyor-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes conveyor-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        /* Ajuste de tempo: 120s e 150s para um movimento extremamente suave e lento */
        .animate-conveyor-left { animation: conveyor-left 120s linear infinite; }
        .animate-conveyor-right { animation: conveyor-right 150s linear infinite; }
        
        /* Rotação dos pratos também muito sutil */
        .animate-spin-slow { animation: spin-slow 180s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 200s linear infinite; }
        
        .mask-radial-fade {
          -webkit-mask-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,1) 80%);
          mask-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,1) 80%);
        }
      `}</style>
    </div>
  );
};

export default FoodConveyor;
