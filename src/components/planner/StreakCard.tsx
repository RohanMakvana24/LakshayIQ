import type { StudyStreak } from '@/types/planner';
import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCardProps {
  streak: StudyStreak;
}

export function StreakCard({ streak }: StreakCardProps) {
  const level =
    streak.current >= 30 ? 'legendary' :
    streak.current >= 14 ? 'epic' :
    streak.current >= 7  ? 'hot' :
    streak.current >= 3  ? 'warm' : 'cold';

  const levelConfig = {
    legendary: { label: 'Legendary 🏆', color: 'text-yellow-600', bg: 'bg-yellow-50', flame: 'text-yellow-500', glow: 'shadow-yellow-200' },
    epic:      { label: 'Epic Streak 🔥', color: 'text-orange-600', bg: 'bg-orange-50', flame: 'text-orange-500', glow: 'shadow-orange-200' },
    hot:       { label: 'On Fire! 🔥',   color: 'text-rose-600',   bg: 'bg-rose-50',   flame: 'text-rose-500',   glow: 'shadow-rose-200' },
    warm:      { label: 'Warming Up ✨', color: 'text-amber-600',  bg: 'bg-amber-50',  flame: 'text-amber-500',  glow: 'shadow-amber-200' },
    cold:      { label: 'Just Starting', color: 'text-zinc-600',   bg: 'bg-zinc-50',   flame: 'text-zinc-400',   glow: 'shadow-zinc-100' },
  }[level];

  return (
    <div className={cn(
      'rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm overflow-hidden relative',
    )}>
      {/* Background glow */}
      {streak.current > 0 && (
        <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-400/10 blur-2xl" />
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', levelConfig.bg)}>
            <Flame className={cn('h-4 w-4', levelConfig.flame)} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Study Streak</h3>
            <p className={cn('text-xs font-semibold', levelConfig.color)}>{levelConfig.label}</p>
          </div>
        </div>

        {/* Streak counts */}
        <div className="grid grid-cols-2 gap-3">
          {/* Current */}
          <div className={cn('rounded-2xl p-4 text-center', levelConfig.bg)}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className={cn('h-4 w-4', levelConfig.flame, streak.current > 0 && 'animate-pulse')} />
            </div>
            <p className={cn('text-3xl font-black leading-none', levelConfig.color)}>
              {streak.current}
            </p>
            <p className="text-xs font-semibold text-zinc-500 mt-1">Current Streak</p>
            <p className="text-[10px] text-zinc-400">days</p>
          </div>

          {/* Best */}
          <div className="rounded-2xl bg-zinc-50 p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-black text-zinc-900 leading-none">{streak.best}</p>
            <p className="text-xs font-semibold text-zinc-500 mt-1">Best Streak</p>
            <p className="text-[10px] text-zinc-400">days</p>
          </div>
        </div>

        {streak.current === 0 && (
          <p className="mt-4 text-center text-xs text-zinc-400">
            Complete a task today to start your streak! 🚀
          </p>
        )}
        {streak.current > 0 && streak.current === streak.best && (
          <p className="mt-4 text-center text-xs font-semibold text-emerald-600">
            🎉 Personal best! Keep it going!
          </p>
        )}
      </div>
    </div>
  );
}
