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
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-emerald-50/20">
      
      {/* Camada de Vidro Otimizada */}
      <div className="absolute inset-0 z-10 backdrop-blur-[12px] bg-white/70 mask-radial-fade"></div>

      <div className="absolute inset-0 transform -rotate-[15deg] scale-150 flex flex-col justify-center gap-16 opacity-50">
        
        {/* Esteira 1: Direita para Esquerda */}
        <div className="flex w-max animate-conveyor-left will-change-transform">
          {[...dishes, ...dishes].map((dish, i) => (
            <div key={`row1-${i}`} className="flex-shrink-0 w-48 h-48 mx-8 rounded-full shadow-2xl overflow-hidden bg-white/50 border-4 border-white/40">
              <img src={dish} alt="Healthy Dish" className="w-full h-full object-cover animate-spin-slow will-change-transform" />
            </div>
          ))}
        </div>

        {/* Esteira 2: Esquerda para Direita */}
        <div className="flex w-max animate-conveyor-right -ml-[50vw] will-change-transform">
          {[...dishes, ...dishes].reverse().map((dish, i) => (
            <div key={`row2-${i}`} className="flex-shrink-0 w-64 h-64 mx-12 rounded-full shadow-2xl overflow-hidden bg-white/50 border-4 border-white/40">
              <img src={dish} alt="Healthy Dish" className="w-full h-full object-cover animate-spin-reverse-slow will-change-transform" />
            </div>
          ))}
        </div>

      </div>

      <style>{`
        .will-change-transform {
          will-change: transform;
          transform: translateZ(0); /* Força aceleração de hardware */
        }

        @keyframes conveyor-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes conveyor-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        .animate-conveyor-left { animation: conveyor-left 120s linear infinite; }
        .animate-conveyor-right { animation: conveyor-right 150s linear infinite; }
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
