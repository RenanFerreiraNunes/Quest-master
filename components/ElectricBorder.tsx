
import React from 'react';

const ElectricBorder: React.FC<{ children: React.ReactNode; color?: string }> = ({ 
  children, 
  color = '#ef4444' 
}) => {
  return (
    <div className="relative group p-[2px] rounded-[3.1rem] overflow-hidden">
      <div 
        className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] pointer-events-none z-0" 
        style={{ 
          background: `conic-gradient(from 0deg, transparent 40%, ${color} 50%, transparent 60%)`,
          opacity: 0.8
        }}
      ></div>
      <div className="relative bg-zinc-950 rounded-[3rem] z-10 w-full">
        {children}
      </div>
    </div>
  );
};

export default ElectricBorder;
