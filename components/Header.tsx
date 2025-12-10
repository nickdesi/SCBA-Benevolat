import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 40%),
                           radial-gradient(circle at 90% 80%, rgba(239, 68, 68, 0.3) 0%, transparent 40%)`
        }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-5 sm:py-6 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Logo and Title */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Logo SCBA */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 rounded-full scale-150"></div>
              <img
                src="/logo-scba.png"
                alt="Logo Stade Clermontois Basket Auvergne"
                className="relative w-16 h-20 sm:w-20 sm:h-24 object-contain drop-shadow-lg"
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                  Stade Clermontois
                </span>
                <br className="sm:hidden" />
                <span className="text-white"> Basket Auvergne</span>
              </h1>
              <p className="text-blue-400/80 text-sm font-medium tracking-wide mt-1">
                🏀 Espace Bénévoles
              </p>
            </div>
          </div>

          {/* Welcome message */}
          <div className="flex flex-col items-center sm:items-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm 
                          rounded-full border border-white/20 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <p className="text-base font-semibold text-white">Bienvenue !</p>
            </div>
            <p className="text-slate-400 mt-2 text-sm">Ensemble, faisons vibrer le parquet ! 🔥</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
