import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient }) => {
    return (
        <div className="group relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-150 cursor-default overflow-hidden hover:scale-[1.01] hover:-translate-y-0.5">
            {/* Decorative background gradient */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-150`}>
                    {icon}
                </div>

                <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                        {label}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
};
