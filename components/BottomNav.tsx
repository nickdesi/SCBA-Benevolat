import React, { memo } from 'react';

interface BottomNavProps {
    currentView: 'home' | 'planning';
    onViewChange: (view: 'home' | 'planning') => void;
    isAdmin: boolean;
    onAdminClick: () => void;
    onPlanningClick: () => void; // Opens ProfileModal
    isAuthenticated: boolean;
}

const BottomNav: React.FC<BottomNavProps> = memo(({
    currentView,
    onViewChange,
    isAdmin,
    onAdminClick,
    onPlanningClick,
    isAuthenticated
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-premium border-t border-slate-200/50 dark:border-slate-700/50 pb-safe z-50 md:hidden shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)] bg-noise">
            <div className="flex justify-around items-center p-2">
                {/* Home Button */}
                <button
                    onClick={() => onViewChange('home')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20
                        ${currentView === 'home'
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={currentView === 'home' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentView === 'home' ? 0 : 2} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <span className="text-[10px] font-bold">Accueil</span>
                </button>

                {/* Planning Button - Opens ProfileModal for authenticated users */}
                {isAuthenticated && (
                    <button
                        onClick={onPlanningClick}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 text-amber-600 hover:bg-amber-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className="text-[10px] font-bold">Planning</span>
                    </button>
                )}

                {/* Admin Button - Only visible when NOT admin (to login) */}
                {!isAdmin && (
                    <button
                        onClick={onAdminClick}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <span className="text-[10px] font-bold">Admin</span>
                    </button>
                )}
            </div>
        </div>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
