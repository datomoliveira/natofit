import React from 'react';

const WeeklyCalendar: React.FC = () => {
  const now = new Date();
  // Ajuste para o fuso do Brasil (Brasília)
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const dayOfWeek = today.getDay(); // 0 (Dom) a 6 (Sab)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); // Começa no Domingo

  const clayBox = {
    boxShadow: '8px 8px 16px rgba(163, 177, 198, 0.4), -8px -8px 16px rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.4)'
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar justify-center px-4">
      {Array.from({ length: 7 }).map((_, i) => {
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
                : 'bg-white/40 backdrop-blur-md text-slate-500'
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
      })}
    </div>
  );
};

export default WeeklyCalendar;
