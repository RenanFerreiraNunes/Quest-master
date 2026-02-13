
import React, { useState } from 'react';
import { CharacterClass, Appearance } from '../types';
import { CLASSES, CLASS_STATS, AVATAR_PRESETS, AVATAR_ICONS } from '../constants';
import HeroAvatar from './HeroAvatar';

interface CharacterCreatorProps {
  initialData?: { nickname: string, charClass: CharacterClass, appearance: Appearance, avatar?: string };
  onComplete: (data: { nickname: string, charClass: CharacterClass, appearance: Appearance, avatar: string }) => void;
  onCancel?: () => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ initialData, onComplete, onCancel }) => {
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [charClass, setCharClass] = useState<CharacterClass>(initialData?.charClass || 'Guerreiro');
  const [avatarIcon, setAvatarIcon] = useState(initialData?.avatar || '🛡️');
  const [appearance, setAppearance] = useState<Appearance>(initialData?.appearance || {
    skinColor: '#ffdbac',
    hairStyle: 'short',
    hairColor: '#4a3728',
    eyeStyle: 'round',
    eyeColor: '#4b8eb5',
    expression: 'neutral',
    outfitColor: '#3f3f46'
  });

  const handleFinish = () => {
    if (!nickname) {
      alert("Seu herói precisa de um nome!");
      return;
    }
    onComplete({ nickname, charClass, appearance, avatar: avatarIcon });
  };

  const applyPreset = (preset: typeof AVATAR_PRESETS[0]) => {
    setAppearance(preset.appearance);
    setCharClass(preset.class);
  };

  const expressions: { emoji: string; value: Appearance['expression'] }[] = [
    { emoji: '😐', value: 'neutral' },
    { emoji: '😊', value: 'happy' },
    { emoji: '🤨', value: 'focused' },
    { emoji: '😁', value: 'grin' },
    { emoji: '😴', value: 'tired' },
    { emoji: '😠', value: 'angry' },
  ];

  return (
    <div className="fixed inset-0 min-h-screen bg-zinc-950 flex items-center justify-center p-6 z-[200]">
      <div className="w-full max-w-6xl bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-8 md:p-12 rounded-[3.5rem] shadow-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 h-[90vh] overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* LADO ESQUERDO: Visual Preview */}
        <div className="lg:col-span-5 flex flex-col items-center bg-zinc-950/40 rounded-[3rem] border border-zinc-800/50 p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-600/5 blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col items-center w-full space-y-6 flex-1 justify-start pt-4">
            {/* Portrait Centered and Higher */}
            <div className="w-64 h-64 bg-zinc-950/80 rounded-[3rem] border border-zinc-800 flex items-center justify-center relative shadow-2xl overflow-hidden group">
               {/* Reduzido translate-y para subir o rosto no portrait */}
               <HeroAvatar appearance={appearance} size={260} className="translate-y-8" />
               <div className="absolute top-4 right-4 text-3xl bg-zinc-900/60 p-2 rounded-xl backdrop-blur-md border border-zinc-800/50">
                 {avatarIcon}
               </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-5xl font-rpg text-white font-black tracking-tight uppercase border-b border-zinc-800 pb-2">{nickname || "Herói"}</h2>
              <div className="inline-block px-4 py-1.5 bg-red-950/40 border border-red-900/60 rounded-full">
                <p className="text-red-500 font-black uppercase tracking-widest text-[9px]">LVL 1 {charClass}</p>
              </div>
            </div>

            <div className="bg-zinc-900/60 p-6 rounded-3xl w-full border border-zinc-800/50 text-center">
              <h4 className="text-[8px] font-black text-zinc-600 uppercase mb-2 tracking-[0.3em]">Lema do Aventureiro</h4>
              <p className="text-sm text-zinc-400 italic font-medium leading-relaxed">
                "Pelo aço e pela coragem, meu destino eu forjo."
              </p>
            </div>
          </div>

          <button 
            onClick={onCancel}
            className="mt-6 w-full py-4 bg-zinc-800/40 text-zinc-500 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all shadow-md active:scale-95"
          >
            Sair da Customização
          </button>
        </div>

        {/* LADO DIREITO: Laboratório da Identidade (Scrollable) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
          <header className="text-center mb-6">
             <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.5em]">Laboratório da Identidade</h3>
          </header>

          {/* Container de Scroll principal para garantir que tudo seja acessível */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-10 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pb-10">
            
            {/* Persona & Expressão */}
            <section className="space-y-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Persona & Expressão</label>
              <div className="flex gap-3 flex-wrap">
                {expressions.map((exp) => (
                  <button 
                    key={exp.value}
                    onClick={() => setAppearance({...appearance, expression: exp.value})}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${appearance.expression === exp.value ? 'bg-red-600/10 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    {exp.emoji}
                  </button>
                ))}
              </div>
            </section>

            {/* Estilo da Coroa (Cabelo) */}
            <section className="space-y-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Estilo da Coroa (Cabelo)</label>
              <div className="grid grid-cols-3 gap-3">
                {['none', 'short', 'spiky', 'long', 'hood'].map((style) => (
                  <button 
                    key={style}
                    onClick={() => setAppearance({...appearance, hairStyle: style as any})}
                    className={`py-5 rounded-2xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${appearance.hairStyle === style ? 'bg-indigo-600/10 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-zinc-950/40 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </section>

            {/* Cores (Horizontal Pair) */}
            <section className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tom da Fisionomia</label>
                <div className="p-1 rounded-2xl bg-zinc-800 border border-zinc-700 h-14 overflow-hidden relative group">
                  <input 
                    type="color" 
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
                    value={appearance.skinColor}
                    onChange={(e) => setAppearance({...appearance, skinColor: e.target.value})}
                  />
                  <div className="w-full h-full rounded-xl transition-transform group-hover:scale-105" style={{ backgroundColor: appearance.skinColor }} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Pigmento Capilar</label>
                <div className="p-1 rounded-2xl bg-zinc-800 border border-zinc-700 h-14 overflow-hidden relative group">
                  <input 
                    type="color" 
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
                    value={appearance.hairColor}
                    onChange={(e) => setAppearance({...appearance, hairColor: e.target.value})}
                  />
                  <div className="w-full h-full rounded-xl transition-transform group-hover:scale-105" style={{ backgroundColor: appearance.hairColor }} />
                </div>
              </div>
            </section>

            {/* Presets Gallery */}
            <section className="space-y-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Modelos da Guilda (Presets)</label>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {AVATAR_PRESETS.map((p, i) => (
                  <button 
                    key={i}
                    onClick={() => applyPreset(p)}
                    className="flex-shrink-0 group flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-red-600">
                      <HeroAvatar appearance={p.appearance} size={60} className="translate-y-3" />
                    </div>
                    <span className="text-[8px] font-black text-zinc-600 uppercase group-hover:text-zinc-300 text-center w-20 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Vocação */}
            <section className="space-y-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Caminho da Vocação</label>
              <div className="grid grid-cols-2 gap-3">
                {CLASSES.map(c => (
                  <button 
                    key={c}
                    onClick={() => setCharClass(c)}
                    className={`py-5 rounded-2xl border-2 transition-all text-[9px] font-black uppercase tracking-widest ${charClass === c ? 'border-red-600 bg-red-600/10 text-white shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>

            {/* Ícone de Perfil */}
            <section className="space-y-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Selo de Identidade (Ícone)</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_ICONS.map((icon) => (
                  <button 
                    key={icon}
                    onClick={() => setAvatarIcon(icon)}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl transition-all ${avatarIcon === icon ? 'bg-red-600/20 border-red-600 shadow-lg' : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </section>

            {/* Nickname Input (Movido para o final do scroll ou mantido aqui) */}
            <section className="space-y-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Nome do Herói</label>
              <input 
                type="text" 
                placeholder="Identifique sua lenda..."
                className="w-full bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-2 ring-red-600 transition-all font-bold text-white border border-zinc-700"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </section>

            {/* Action Button inside the scroll or as a final element */}
            <div className="pt-6">
              <button 
                onClick={handleFinish}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-all active:scale-95 border-b-8 border-red-800"
              >
                Consolidar Alma
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
