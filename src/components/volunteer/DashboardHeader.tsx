import React, { useCallback } from 'react';
import { User } from 'firebase/auth';
import { X, LayoutDashboard, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { useAvatars } from '../../hooks/useAvatars';

interface DashboardHeaderProps {
  user: User;
  activeTab: 'dashboard' | 'communication';
  setActiveTab: (tab: 'dashboard' | 'communication') => void;
  onClose: () => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  onDragStart?: (e: React.PointerEvent) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onClose,
  onDragStart,
}) => {
  const { getAvatar } = useAvatars();

  const handleTabChange = useCallback(
    (tab: 'dashboard' | 'communication') => {
      if (activeTab !== tab) {
        triggerHaptic('light');
        setActiveTab(tab);
      }
    },
    [activeTab, setActiveTab],
  );

  return (
    <div
      onPointerDown={(e) => {
        if (typeof window !== 'undefined' && window.innerWidth >= 640) return;
        if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) return;
        onDragStart?.(e);
      }}
      className="relative flex-shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl z-20 overflow-hidden border-b border-white/5 cursor-grab active:cursor-grabbing sm:cursor-default"
    >
      {/* Elite Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Static blur — no animate-pulse to avoid costly GPU repaints */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
        {/* Subtle noise overlay via pure CSS — no external network request */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='2' height='2' fill='%23fff'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23fff'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden border border-white/10 relative">
              {getAvatar(user.displayName ?? '') || user.photoURL ? (
                <img
                  src={getAvatar(user.displayName ?? '') || user.photoURL!}
                  alt={user.displayName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-lg text-indigo-400">
                  {user.displayName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="hidden xs:block">
            <h2 className="text-base sm:text-lg font-black leading-tight text-white tracking-tight">
              {user.displayName}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Bénévole SCBA
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs (Elite Morphic) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex bg-white/5 dark:bg-slate-800/40 p-1 rounded-full border border-white/10 dark:border-slate-700/50 backdrop-blur-xl shadow-inner-premium"
        >
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`group relative flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutDashboard
              className={`w-4 h-4 z-10 transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110' : 'group-hover:scale-110'}`}
            />
            <span className="hidden sm:inline z-10">Dashboard</span>
            {activeTab === 'dashboard' && (
              <motion.div
                layoutId="header-tab-bg"
                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/40"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => handleTabChange('communication')}
            className={`group relative flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === 'communication' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <MessageCircle
              className={`w-4 h-4 z-10 transition-transform duration-300 ${activeTab === 'communication' ? 'scale-110' : 'group-hover:scale-110'}`}
            />
            <span className="hidden sm:inline z-10">Chat</span>
            {activeTab === 'communication' && (
              <motion.div
                layoutId="header-tab-bg"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/40"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </motion.div>

        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('medium');
            onClose();
          }}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all border border-white/5 shadow-premium"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      </div>
    </div>
  );
};
