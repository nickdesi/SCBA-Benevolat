import React, { useCallback } from 'react';
import { User } from 'firebase/auth';
import { X, LayoutDashboard, MessageCircle, Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { uploadAvatar, updateUserAvatar } from '../../utils/userStore';
import { updateProfile } from 'firebase/auth';

interface DashboardHeaderProps {
    user: User;
    activeTab: 'dashboard' | 'communication';
    setActiveTab: (tab: 'dashboard' | 'communication') => void;
    onClose: () => void;
    onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    user,
    activeTab,
    setActiveTab,
    onClose,
    onToast
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = React.useState(false);

    const handleTabChange = useCallback((tab: 'dashboard' | 'communication') => {
        if (activeTab !== tab) {
            triggerHaptic('light');
            setActiveTab(tab);
        }
    }, [activeTab, setActiveTab]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            onToast?.('Veuillez sélectionner une image.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            onToast?.('L\'image est trop volumineuse (max 5Mo).', 'error');
            return;
        }

        try {
            setUploading(true);
            const downloadURL = await uploadAvatar(file, user.uid);
            await updateProfile(user, { photoURL: downloadURL });
            await updateUserAvatar(user, downloadURL);
            onToast?.('Photo de profil mise à jour !', 'success');
        } catch (error) {
            console.error("Error uploading avatar:", error);
            onToast?.('Erreur lors de la mise à jour.', 'error');
        } finally {
            setUploading(false);
        }
    };


    return (
        <div className="relative flex-shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl z-20 overflow-hidden border-b border-white/5">
            {/* Elite Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] invert" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
                {/* User Info */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/30 cursor-pointer group"
                    >
                        <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden border border-white/10 relative">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-lg text-indigo-400">
                                    {user.displayName?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Upload Overlay */}
                            <div className="absolute inset-0 bg-black/40 md:bg-black/0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover:bg-black/50 transition-all duration-300">
                                {uploading ? (
                                    <Loader2 className="w-5 h-5 md:w-4 md:h-4 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-5 h-5 md:w-4 md:h-4 text-white/90 md:text-white drop-shadow-md" />
                                )}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                        />
                    </motion.div>
                    <div className="hidden xs:block">
                        <h2 className="text-base sm:text-lg font-black leading-tight text-white tracking-tight">{user.displayName}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bénévole SCBA</p>
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
                        <LayoutDashboard className={`w-4 h-4 z-10 transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="hidden sm:inline z-10">Dashboard</span>
                        {activeTab === 'dashboard' && (
                            <motion.div
                                layoutId="header-tab-bg"
                                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/40"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('communication')}
                        className={`group relative flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === 'communication' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <MessageCircle className={`w-4 h-4 z-10 transition-transform duration-300 ${activeTab === 'communication' ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="hidden sm:inline z-10">Chat</span>
                        {activeTab === 'communication' && (
                            <motion.div
                                layoutId="header-tab-bg"
                                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/40"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
