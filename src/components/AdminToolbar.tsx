import React from 'react';

interface AdminToolbarProps {
    onImport: () => void;
    onAddGame: () => void;
}

const AdminToolbar: React.FC<AdminToolbarProps> = ({ onImport, onAddGame }) => {
    return (
        <div className="flex flex-wrap items-center justify-end gap-3 mb-6 animate-fade-in">
            <div className="flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60">
                <button
                    onClick={onImport}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all duration-200"
                    title="Importer des matchs depuis un CSV"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="hidden sm:inline">Importer</span>
                </button>
            </div>

            <button
                onClick={onAddGame}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter un match
            </button>
        </div>
    );
};

export default AdminToolbar;
