
import React from 'react';

interface StatsBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon?: string;
}

const StatsBar: React.FC<StatsBarProps> = ({ label, current, max, color, icon }) => {
  const percentage = Math.min(100, (current / max) * 100);

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-zinc-400">
        <span className="flex items-center gap-1">
          {icon} {label}
        </span>
        <span>{current} / {max}</span>
      </div>
      <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default StatsBar;
