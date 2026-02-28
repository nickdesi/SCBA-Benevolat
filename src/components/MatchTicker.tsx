import React, { memo, useMemo } from 'react';
import Marquee from 'react-fast-marquee';
import type { Game } from '../types';

interface MatchTickerProps {
    games: Game[];
}

const MatchTicker: React.FC<MatchTickerProps> = memo(({ games }) => {
    // Filter games: get the next 10 upcoming games regardless of timeframe
    const upcomingGames = useMemo(() => {
        const nowISO = new Date().toISOString().split('T')[0];

        return games
            .filter(g => {
                const d = g.dateISO;
                // Keep only future or today's games
                return d && d >= nowISO;
            })
            .sort((a, b) => (a.dateISO || '').localeCompare(b.dateISO || ''))
            .slice(0, 10); // Take next 10 games
    }, [games]);

    if (upcomingGames.length === 0) return null;

    return (
        <div className="relative z-30 border-b border-slate-800 bg-slate-950 overflow-hidden py-2.5">
            {/* Gradient Overlay for modern feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-emerald-900/10 pointer-events-none z-10" />

            <Marquee
                speed={35}
                gradient={true}
                gradientColor="2, 6, 23" // slate-950 as string
                gradientWidth={50}
                pauseOnHover={true}
                autoFill={true}
                className="!overflow-y-hidden"
            >
                {upcomingGames.map((game, i) => {
                    // Determine Host and Visitor
                    const host = game.isHome ? game.team : game.opponent;
                    const visitor = game.isHome ? game.opponent : game.team;

                    return (
                        <div key={`${game.id}-${i}`} className="flex items-center gap-4 mr-16 select-none group border-r border-slate-800/50 pr-4 last:border-0">
                            {/* Date & Time Group */}
                            <div className="flex flex-col items-end leading-none min-w-[50px]">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                                    {game.dateISO ? new Date(game.dateISO).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}
                                </span>
                                <span className="text-xs font-bold text-white font-mono">
                                    {game.time}
                                </span>
                            </div>

                            {/* Teams */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold uppercase tracking-tight ${game.isHome ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {host}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center px-2">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">VS</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold uppercase tracking-tight ${!game.isHome ? 'text-blue-400' : 'text-slate-400'}`}>
                                        {visitor}
                                    </span>
                                </div>
                            </div>

                            {/* Location/Type Indicator */}
                            <div className={`
                                flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold shadow-sm ring-1 ring-inset
                                ${game.isHome
                                    ? 'bg-emerald-950/30 text-emerald-400 ring-emerald-500/20'
                                    : 'bg-blue-950/30 text-blue-400 ring-blue-500/20'}
                            `}>
                                {game.isHome ? '🏠' : '✈️'}
                            </div>
                        </div>
                    );
                })}
            </Marquee>
        </div>
    );
});

MatchTicker.displayName = 'MatchTicker';

export default MatchTicker;
