
import React, { useEffect, useRef } from 'react';

const ClickSpark: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: MouseEvent) => {
    const spark = document.createElement('div');
    spark.className = 'absolute pointer-events-none rounded-full bg-white opacity-60 mix-blend-screen animate-ping';
    spark.style.width = '20px';
    spark.style.height = '20px';
    spark.style.left = `${e.clientX - 10}px`;
    spark.style.top = `${e.clientY - 10}px`;
    spark.style.zIndex = '9999';

    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 600);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return <div ref={containerRef} className="h-full w-full">{children}</div>;
};

export default ClickSpark;
