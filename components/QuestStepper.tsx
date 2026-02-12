
import React, { useState } from 'react';
import { Rarity, Difficulty } from '../types';
import { RARITIES, DIFFICULTIES } from '../constants';

interface QuestStepperProps {
  onComplete: (data: { title: string; rarity: Rarity; difficulty: Difficulty; duration: number }) => void;
  onCancel: () => void;
}

const QuestStepper: React.FC<QuestStepperProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [rarity, setRarity] = useState<Rarity>('comum');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [duration, setDuration] = useState(5);

  const steps = [
    { n: 1, label: 'Alvo', icon: '🎯' },
    { n: 2, label: 'Perigo', icon: '🐉' },
    { n: 3, label: 'Preparo', icon: '⏳' },
  ];

  const handleNext = () => {
    if (step === 1 && !title) return;
    if (step < 3) setStep(step + 1);
    else onComplete({ title, rarity, difficulty, duration });
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-zinc-800 shadow-3xl animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-rpg">Contrato de <span className="text-red-600">Missão</span></h2>
        <button onClick={onCancel} className="text-zinc-600 hover:text-white">✕</button>
      </div>

      {/* Progress Line */}
      <div className="flex items-center justify-between mb-12 relative px-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
        {steps.map((s) => (
          <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step >= s.n ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-zinc-800 text-zinc-600'}`}>
              {s.n < step ? '✓' : s.n}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s.n ? 'text-zinc-100' : 'text-zinc-700'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[200px] flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">O que deve ser feito?</label>
            <input 
              autoFocus
              className="w-full bg-transparent border-b-2 border-zinc-800 p-2 text-3xl focus:border-red-600 outline-none transition-colors font-bold"
              placeholder="Ex: Treinar Espada..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(RARITIES).map((r) => (
                <button 
                  key={r}
                  onClick={() => setRarity(r as Rarity)}
                  className={`p-4 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-widest ${rarity === r ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Qual a dificuldade do desafio?</label>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(DIFFICULTIES).map(([k, d]) => (
                <button 
                  key={k}
                  onClick={() => setDifficulty(k as Difficulty)}
                  className={`p-6 rounded-3xl border-2 flex justify-between items-center transition-all ${difficulty === k ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                >
                  <span className={`font-black uppercase tracking-widest ${d.color}`}>{d.label}</span>
                  <span className="text-[10px] text-zinc-500">Multiplicador: {d.multiplier}x</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Duração da Jornada (Minutos)</label>
            <div className="flex items-center gap-6">
               <button onClick={() => setDuration(Math.max(1, duration - 5))} className="w-12 h-12 bg-zinc-800 rounded-xl font-black text-xl hover:bg-zinc-700">-</button>
               <span className="text-5xl font-black font-mono flex-1 text-center">{duration}</span>
               <button onClick={() => setDuration(duration + 5)} className="w-12 h-12 bg-zinc-800 rounded-xl font-black text-xl hover:bg-zinc-700">+</button>
            </div>
            <p className="text-xs text-zinc-500 text-center">Quanto mais tempo, maior a recompensa de foco.</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-12">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="px-8 py-4 rounded-2xl border border-zinc-800 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800">Voltar</button>
        )}
        <button onClick={handleNext} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all shadow-xl">
          {step === 3 ? 'Sincronizar Destino' : 'Continuar'}
        </button>
      </div>
    </div>
  );
};

export default QuestStepper;
