
import React from 'react';

const BasketballIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
    <path d="M12 4c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0 6c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2z"></path>
    <path d="M12 14c-4.411 0-8 1.794-8 4h16c0-2.206-3.589-4-8-4z"></path>
  </svg>
);


const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <BasketballIcon className="w-10 h-10 text-red-500" />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Stade Clermontois Basket Auvergne
          </h1>
        </div>
        <div className="text-center sm:text-right">
            <p className="text-lg font-semibold text-red-400">Salut les amigos !</p>
            <p className="text-slate-300">Un gros week-end en perspective !</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
