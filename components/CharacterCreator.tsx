
import React, { useState } from 'react';
import { CharacterClass, Appearance } from '../types';
import { CLASSES, CLASS_STATS } from '../constants';
import HeroAvatar from './HeroAvatar';

interface CharacterCreatorProps {
  onComplete: (data: { nickname: string, charClass: CharacterClass, appearance: Appearance }) => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [charClass, setCharClass] = useState<CharacterClass>('Guerreiro');
  const [appearance, setAppearance] = useState<Appearance>({
    skinColor: '#ffdbac',
    hairStyle: 'short',
    hairColor: '#4a3728',
    eyeColor: '#4b8eb5',
    expression: 'neutral',
    outfitColor: '#3f3f46'
  });

  const handleFinish = () => {
    if (!nickname) {
      alert("Seu herói precisa de um nome!");
      return;
    }
    onComplete({ nickname, charClass, appearance });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-8 md:p-12 rounded-[3.5rem] shadow-3xl grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Visual Preview */}
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="w-64 h-64 bg-zinc-950 rounded-[4rem] border-2 border-zinc-800 flex items-center justify-center relative overflow-hidden shadow-inner">
            <HeroAvatar appearance={appearance} size={200} />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-rpg text-white uppercase">{nickname || "Herói Anônimo"}</h2>
            <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">{charClass}</p>
          </div>
          <div className="bg-zinc-800/50 p-6 rounded-3xl w-full">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-2">Bônus de Classe</h4>
            <p className="text-sm text-zinc-300 italic">"{CLASS_STATS[charClass].description}"</p>
          </div>
        </div>

        {/* Customization Controls */}
        <div className="space-y-8 overflow-y-auto max-h-[70vh] pr-4 scrollbar-hide">
          <section className="space-y-4">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Codinome do Aventureiro</label>
            <input 
              type="text" 
              placeholder="Ex: Arion, o Bravo"
              className="w-full bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-2 ring-red-600 transition-all font-bold text-white"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </section>

          <section className="space-y-4">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Vocação (Classe)</label>
            <div className="grid grid-cols-2 gap-3">
              {CLASSES.map(c => (
                <button 
                  key={c}
                  onClick={() => setCharClass(c)}
                  className={`p-4 rounded-2xl border-2 transition-all text-xs font-black uppercase ${charClass === c ? 'border-red-600 bg-red-600/10 text-white' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Aparência Física</label>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-600 uppercase font-bold">Cabelo</span>
                <select 
                  className="w-full bg-zinc-800 p-3 rounded-xl text-xs outline-none"
                  value={appearance.hairStyle}
                  onChange={(e) => setAppearance({...appearance, hairStyle: e.target.value as any})}
                >
                  <option value="none">Careca</option>
                  <option value="short">Curto</option>
                  <option value="long">Longo</option>
                  <option value="spiky">Espetado</option>
                  <option value="hood">Capuz</option>
                  <option value="helmet">Elmo</option>
                </select>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-600 uppercase font-bold">Pele</span>
                <input 
                  type="color" 
                  className="w-full h-10 rounded-xl bg-zinc-800 p-1 cursor-pointer"
                  value={appearance.skinColor}
                  onChange={(e) => setAppearance({...appearance, skinColor: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-600 uppercase font-bold">Cor Cabelo</span>
                <input 
                  type="color" 
                  className="w-full h-10 rounded-xl bg-zinc-800 p-1 cursor-pointer"
                  value={appearance.hairColor}
                  onChange={(e) => setAppearance({...appearance, hairColor: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-600 uppercase font-bold">Expressão</span>
                <select 
                  className="w-full bg-zinc-800 p-3 rounded-xl text-xs outline-none"
                  value={appearance.expression}
                  onChange={(e) => setAppearance({...appearance, expression: e.target.value as any})}
                >
                  <option value="neutral">Neutro</option>
                  <option value="happy">Feliz</option>
                  <option value="focused">Focado</option>
                  <option value="grin">Sorridente</option>
                  <option value="tired">Cansado</option>
                </select>
              </div>
            </div>
          </section>

          <button 
            onClick={handleFinish}
            className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
          >
            Iniciar Jornada
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
