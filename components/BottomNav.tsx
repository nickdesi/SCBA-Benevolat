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
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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

                {/* Admin Button - Only visible when admin */}
                {isAdmin && (
                    <button
                        onClick={onAdminClick}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 text-emerald-600 bg-emerald-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-bold">Admin ✓</span>
                    </button>
                )}
            </div>
        </div>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
