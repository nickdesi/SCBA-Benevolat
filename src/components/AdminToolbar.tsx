import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload } from 'lucide-react';

interface AdminToolbarProps {
  onImport: () => void;
  onAddGame: () => void;
}

const AdminToolbar: React.FC<AdminToolbarProps> = ({ onImport, onAddGame }) => {
  return (
    <div className="flex items-center justify-end gap-2.5 sm:gap-3 mb-6 select-none">
      {/* Container Capsule with Glassmorphism */}
      <div className="flex items-center gap-2 p-1.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-md shadow-slate-900/5 dark:shadow-black/20 border border-slate-200/80 dark:border-slate-800">
        {/* Manual Import CSV Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onImport}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 border border-slate-200 dark:border-slate-700 cursor-pointer font-sport tracking-wide"
          title="Importer manuellement une liste de rencontres (format CSV ou copier-coller)"
        >
          <Upload className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>Import manuel (CSV)</span>
        </motion.button>

        {/* Add Match Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAddGame}
          className="group relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all duration-200 cursor-pointer overflow-hidden font-sport tracking-wide"
          title="Ajouter manuellement une nouvelle rencontre"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="font-extrabold">Ajouter un match</span>
        </motion.button>
      </div>
    </div>
  );
};

export default AdminToolbar;
