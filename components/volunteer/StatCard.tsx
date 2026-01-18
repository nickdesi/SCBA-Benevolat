import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform -rotate-3`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    );
};
