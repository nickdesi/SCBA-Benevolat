import React, { memo } from 'react';

/**
 * Premium skeleton loader with shimmer effect
 * Matches GameCard structure for minimal layout shift
 */
const SkeletonLoader: React.FC = memo(() => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map((index) => (
                <div
                    key={index}
                    className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-slate-700/40 to-transparent z-10" />

                    {/* Header skeleton - matches GameHeader */}
                    <div className="p-5 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
                            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                        </div>
                        <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3 mb-2" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    </div>

                    {/* Accordion trigger skeleton */}
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                        <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
});

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;

