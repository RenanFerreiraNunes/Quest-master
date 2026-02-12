
import React from 'react';

interface ChromaGridProps {
  color?: string;
}

const ChromaGrid: React.FC<ChromaGridProps> = ({ color = 'rgba(255,255,255,0.03)' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950" />
    </div>
  );
};

export default ChromaGrid;
