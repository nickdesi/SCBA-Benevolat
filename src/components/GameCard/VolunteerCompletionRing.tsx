import React, { memo, useId } from 'react';
import { CheckIcon } from 'lucide-react';

interface VolunteerCompletionRingProps {
  filled: number;
  total: number;
  isFullyStaffed: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export const VolunteerCompletionRing: React.FC<VolunteerCompletionRingProps> = memo(
  ({
    filled,
    total,
    isFullyStaffed,
    size = 72,
    strokeWidth = 6,
    className = '',
    showLabel = true,
  }) => {
    const rawId = useId();
    const uniqueGradientId = `ring-grad-${rawId.replace(/:/g, '')}`;

    const validTotal = Math.max(total, 1);
    const validFilled = Math.min(Math.max(filled, 0), validTotal);
    const percentage = isFullyStaffed ? 100 : Math.round((validFilled / validTotal) * 100);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Status colors
    const getColors = () => {
      if (isFullyStaffed) {
        return {
          start: '#10b981',
          end: '#34d399',
          stroke: '#10b981',
          glow: 'rgba(16, 185, 129, 0.35)',
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      }
      if (percentage >= 50) {
        return {
          start: '#3629e1',
          end: '#6366f1',
          stroke: '#3629e1',
          glow: 'rgba(54, 41, 225, 0.35)',
          badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        };
      }
      return {
        start: '#f97316',
        end: '#aa2e0f',
        stroke: '#f97316',
        glow: 'rgba(249, 115, 22, 0.35)',
        badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      };
    };

    const colors = getColors();

    return (
      <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
        <div
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} className="transform -rotate-90">
            <defs>
              <linearGradient id={uniqueGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.start} />
                <stop offset="100%" stopColor={colors.end} />
              </linearGradient>
            </defs>

            {/* Track Background */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-200/90 dark:text-slate-700/80"
              fill="transparent"
            />

            {/* Progress Stroke */}
            {percentage > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 0 5px ${colors.glow})`,
                }}
              />
            )}
          </svg>

          {/* Center Text / Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isFullyStaffed ? (
              <div className="flex items-center justify-center p-1.5 rounded-full bg-emerald-500 text-white shadow-sm">
                <CheckIcon className="w-4 h-4" strokeWidth={3} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center leading-none">
                <span className="font-sport font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                  {filled}/{total}
                </span>
              </div>
            )}
          </div>
        </div>

        {showLabel && (
          <span
            className={`mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.badgeBg}`}
          >
            {isFullyStaffed ? 'Complet' : 'Bénévoles'}
          </span>
        )}
      </div>
    );
  },
);

VolunteerCompletionRing.displayName = 'VolunteerCompletionRing';
export default VolunteerCompletionRing;
