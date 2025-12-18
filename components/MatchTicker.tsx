import React, { useMemo } from 'react';
import type { Game } from '../types';

interface MatchTickerProps {
    games: Game[];
}

const MatchTicker: React.FC<MatchTickerProps> = ({ games }) => {
    // Filter games for the next 14 days
    const upcomingGames = useMemo(() => {
        const now = new Date();
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(now.getDate() + 14);

        const nowISO = now.toISOString().split('T')[0];
        const endISO = twoWeeksLater.toISOString().split('T')[0];

        return games
            .filter(g => {
                // Use dateISO or fallback
                let d = g.dateISO;
                if (!d && g.date) {
                    // Try rough check for legacy
                    return true;
                }
                return d && d >= nowISO && d <= endISO;
            })
            .sort((a, b) => (a.dateISO || '').localeCompare(b.dateISO || ''));
    }, [games]);

    if (upcomingGames.length === 0) return null;

    // Duplicate content once (2 copies total) for seamless loop
    const tickerItems = [...upcomingGames, ...upcomingGames];

    return (
        <div className="bg-slate-900 border-b border-slate-800 text-white overflow-hidden py-2 relative z-30">
            <div className="flex items-center animate-marquee whitespace-nowrap hover:pause">
                <div className="flex gap-8 items-center px-4">
                    {tickerItems.map((game, i) => {
                        // Determine Host and Visitor for display (Host vs Visitor)
                        const host = game.isHome ? game.team : game.opponent;
                        const visitor = game.isHome ? game.opponent : game.team;

                        return (
                            <div key={`${game.id}-${i}`} className="flex items-center gap-2 text-sm font-medium">
                                {i % upcomingGames.length === 0 && (
                                    <span className="font-bold text-amber-400 uppercase tracking-widest text-xs ml-4">⚡ À VENIR :</span>
                                )}
                                <span className="text-slate-400">{game.date} à {game.time}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${game.isHome
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                    {game.isHome ? 'DOM' : 'EXT'}
                                </span>
                                <span className="text-white font-bold">{host}</span>
                                <span className="text-slate-500">vs</span>
                                <span className="text-slate-200">{visitor}</span>
                                <span className="text-slate-600 mx-2">|</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MatchTicker;
