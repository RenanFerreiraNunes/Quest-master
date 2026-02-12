
import React from 'react';

interface ChromaGridProps {
  color?: string;
  scrollOffset?: number;
}

const ChromaGrid: React.FC<ChromaGridProps> = ({ color = 'rgba(255,255,255,0.03)', scrollOffset = 0 }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div 
        className="absolute inset-0 transition-transform duration-75 ease-out"
        style={{
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)',
          transform: `translateY(${scrollOffset * 0.2}px)`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950" />
    </div>
  );
};

export default ChromaGrid;
