import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus, Sparkles } from 'lucide-react';

interface AdminToolbarProps {
  onImport: () => void;
  onAddGame: () => void;
}

const AdminToolbar: React.FC<AdminToolbarProps> = ({ onImport, onAddGame }) => {
  return (
    <div className="flex items-center justify-end gap-2.5 sm:gap-3 mb-6 select-none">
      {/* Container Capsule with Glassmorphism */}
      <div className="flex items-center gap-2 p-1.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-md shadow-slate-900/5 dark:shadow-black/20 border border-slate-200/80 dark:border-slate-800">
        {/* 1-Click FFBB Sync Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onImport}
          className="group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all duration-200 cursor-pointer overflow-hidden font-sport tracking-wide"
          title="Synchronisation automatique des matchs en 1-Clic depuis la FFBB"
        >
          {/* Subtle shine effect */}
          <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

          <Zap className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform duration-200" />
          <span className="font-extrabold">Synchroniser FFBB</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-white/20 text-cyan-100 border border-white/20 ml-0.5">
            1-Clic
          </span>
        </motion.button>

        {/* Add Match Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAddGame}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 border border-slate-750 dark:border-slate-650 cursor-pointer font-sport tracking-wide"
          title="Ajouter manuellement une nouvelle rencontre"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Ajouter un match</span>
        </motion.button>
      </div>
    </div>
  );
};

export default AdminToolbar;
