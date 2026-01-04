import React, { memo } from 'react';

const SkeletonLoader: React.FC = memo(() => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((index) => (
                <div
                    key={index}
                    className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-200 bg-white"
                >
                    {/* Simplified Header */}
                    <div className="p-6 bg-slate-100 animate-pulse">
                        <div className="h-6 bg-slate-200 rounded-lg w-1/3 mb-3"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    </div>

                    {/* Simplified Body */}
                    <div className="p-6 space-y-4">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse"></div>
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="h-32 bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                    </div>
                </div>
            ))}
        </div>
    );
});

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
