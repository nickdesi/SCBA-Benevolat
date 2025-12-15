import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((index) => (
                <div
                    key={index}
                    className="relative overflow-hidden rounded-2xl shadow-xl border border-slate-200 bg-white"
                >
                    {/* Card Header Skeleton */}
                    <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 animate-pulse">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="h-6 bg-white/30 rounded-lg w-1/3"></div>
                            <div className="h-6 bg-white/30 rounded-full w-20"></div>
                        </div>
                        <div className="h-8 bg-white/30 rounded-lg w-2/3"></div>
                    </div>

                    {/* Card Body Skeleton */}
                    <div className="p-5 sm:p-6">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 pb-6 border-b border-slate-100">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl animate-pulse">
                                    <div className="w-9 h-9 bg-slate-300 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-300 rounded w-12"></div>
                                        <div className="h-4 bg-slate-300 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Volunteer Section */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-slate-300 rounded-xl animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-slate-300 rounded w-1/2 animate-pulse"></div>
                                    <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                                </div>
                            </div>

                            {/* Volunteer Slots */}
                            <div className="space-y-3">
                                {[1, 2, 3].map((slot) => (
                                    <div key={slot} className="bg-slate-100 rounded-xl p-4 animate-pulse">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="h-5 bg-slate-300 rounded w-1/4"></div>
                                            <div className="h-5 bg-slate-300 rounded w-16"></div>
                                        </div>
                                        <div className="h-10 bg-slate-300 rounded-lg w-full"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
