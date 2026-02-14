
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
  const [zoomLevel, setZoomLevel] = useState(1); // 0: Afastado, 1: Normal, 2: Focado
  
  const [appearance, setAppearance] = useState<Appearance>(initialData?.appearance || {
    skinColor: '#ffdbac',
    hairStyle: 'short',
    hairColor: '#4a3728',
    facialHair: 'none',
    facialHairColor: '#4a3728',
    eyebrowStyle: 'normal',
    eyeStyle: 'round',
    eyeColor: '#4b8eb5',
    expression: 'neutral',
    outfitColor: '#3f3f46',
    neckOffset: 0
  });

  const handleFinish = () => {
    const trimmedName = nickname.trim();
    if (!trimmedName) {
      alert("Seu herói precisa de um nome digno!");
      return;
    }
    onComplete({ 
      nickname: trimmedName, 
      charClass, 
      appearance, 
      avatar: avatarIcon 
    });
  };

  const eyeStyles: { label: string; value: Appearance['eyeStyle'] }[] = [
    { label: 'Normal', value: 'round' },
    { label: 'Afiado', value: 'sharp' },
    { label: 'Místico', value: 'glow' },
    { label: 'Grande', value: 'large' },
    { label: 'Cerrado', value: 'closed' },
  ];

  const facialHairStyles: { label: string; value: Appearance['facialHair'] }[] = [
    { label: 'Liso', value: 'none' },
    { label: 'Sombra', value: 'stubble' },
    { label: 'Cavanhaque', value: 'goatee' },
    { label: 'Bigode', value: 'mustache' },
    { label: 'Barba', value: 'beard' },
  ];

  const eyebrowStyles: { label: string; value: Appearance['eyebrowStyle'] }[] = [
    { label: 'Nenhuma', value: 'none' },
    { label: 'Normal', value: 'normal' },
    { label: 'Grossa', value: 'thick' },
    { label: 'Fina', value: 'thin' },
    { label: 'Raiva', value: 'angry' },
  ];

  const expressions: { emoji: string; value: Appearance['expression'] }[] = [
    { emoji: '😐', value: 'neutral' },
    { emoji: '😊', value: 'happy' },
    { emoji: '🤨', value: 'focused' },
    { emoji: '😁', value: 'grin' },
    { emoji: '😴', value: 'tired' },
    { emoji: '😠', value: 'angry' },
    { emoji: '😲', value: 'surprised' },
  ];

  // Hood removido da criação conforme solicitado
  const hairStyles: Appearance['hairStyle'][] = ['none', 'short', 'spiky', 'long', 'mohawk', 'bob', 'braids'];

  const getZoomStyle = () => {
    if (zoomLevel === 0) return 'scale-[0.7] translate-y-[-10px]';
    if (zoomLevel === 1) return 'scale-[0.85] translate-y-4';
    return 'scale-[1.4] translate-y-32';
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-zinc-950 flex items-center justify-center p-4 md:p-8 z-[200] overflow-hidden">
      <div className="w-full max-w-6xl bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-6 md:p-12 rounded-[4rem] shadow-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 h-[92vh] max-h-[900px] animate-in zoom-in-95 duration-500 relative">
        
        {/* COLUNA ESQUERDA: Preview do Herói */}
        <div className="lg:col-span-5 flex flex-col items-center bg-zinc-950/60 rounded-[3rem] border border-zinc-800/50 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-600/5 blur-[120px] pointer-events-none" />
          
          <div className="flex flex-col items-center w-full space-y-8 flex-1 justify-center relative z-10">
            {/* CONTAINER DO AVATAR COM FOCO DE CÂMERA */}
            <div className="w-64 h-64 md:w-80 md:h-80 bg-zinc-950/80 rounded-[3.5rem] border-2 border-zinc-800 flex items-center justify-center relative shadow-3xl overflow-hidden group">
               <div className={`transition-all duration-700 ease-in-out transform ${getZoomStyle()}`}>
                 <HeroAvatar appearance={appearance} size={300} />
               </div>

               {/* Botão de Foco de Câmera 3 estágios */}
               <button 
                onClick={() => setZoomLevel((zoomLevel + 1) % 3)}
                className={`absolute top-6 left-6 p-4 rounded-2xl border transition-all z-20 bg-zinc-900/80 text-zinc-500 border-zinc-700 hover:text-white flex items-center gap-2`}
                title="Alternar Foco de Câmera"
               >
                 <span className="text-xl">🔍</span>
                 <span className="text-[9px] font-black uppercase tracking-widest">{zoomLevel === 0 ? 'Afastado' : zoomLevel === 1 ? 'Normal' : 'Focado'}</span>
               </button>

               <div className="absolute top-6 right-6 text-4xl md:text-5xl bg-zinc-900/90 p-3 rounded-2xl backdrop-blur-md border border-zinc-700/50 shadow-2xl">
                 {avatarIcon}
               </div>
            </div>

            <div className="text-center space-y-4 w-full">
              <h2 className="text-5xl md:text-6xl font-rpg text-white font-black tracking-tighter uppercase border-b-2 border-zinc-800/50 pb-4 inline-block px-8">
                {nickname || "Sem Nome"}
              </h2>
              <div className="flex justify-center">
                <div className="px-6 py-2 bg-red-950/40 border border-red-900/40 rounded-full shadow-lg">
                  <p className="text-red-500 font-black uppercase tracking-[0.3em] text-[10px] md:text-[11px]">
                    Nível 1 {charClass}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {onCancel && (
            <button 
              onClick={onCancel}
              className="mt-8 w-full py-4 bg-zinc-900/80 text-zinc-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-zinc-800 hover:text-red-500 hover:bg-red-950/20 transition-all active:scale-95"
            >
              Cancelar Jornada
            </button>
          )}
        </div>

        {/* COLUNA DIREITA: Painel de Customização */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden relative pb-24">
          <header className="text-center mb-8 border-b border-zinc-800 pb-4">
             <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em]">Oficina de Almas</h3>
          </header>

          <div className="flex-1 overflow-y-auto pr-4 space-y-12 scrollbar-hide custom-scroll pb-10">
            {/* Identidade */}
            <section className="space-y-6">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span> Apelido da Lenda
              </label>
              <input 
                type="text" 
                maxLength={18}
                placeholder="Como as canções te chamarão?..."
                className="w-full bg-zinc-950 p-6 rounded-3xl outline-none focus:ring-4 ring-red-600/20 transition-all font-bold text-white border border-zinc-800 shadow-inner text-xl placeholder:text-zinc-800"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </section>

            {/* Trilha de Classe */}
            <section className="space-y-6">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Destino do Herói</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CLASSES.map(c => (
                  <button 
                    key={c}
                    onClick={() => setCharClass(c)}
                    className={`py-5 rounded-3xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${charClass === c ? 'border-red-600 bg-red-600/10 text-white shadow-xl' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 bg-zinc-950/40'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>

            {/* Sobrancelhas */}
            <section className="space-y-6">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Traços Supercílios</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {eyebrowStyles.map(s => (
                  <button key={s.value} onClick={() => setAppearance({...appearance, eyebrowStyle: s.value})} className={`py-4 rounded-2xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${appearance.eyebrowStyle === s.value ? 'bg-amber-600/20 border-amber-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{s.label}</button>
                ))}
              </div>
            </section>

            {/* Estilo dos Olhos */}
            <section className="space-y-6">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Olhar do Destino</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {eyeStyles.map(s => (
                  <button key={s.value} onClick={() => setAppearance({...appearance, eyeStyle: s.value})} className={`py-4 rounded-2xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${appearance.eyeStyle === s.value ? 'bg-indigo-600/20 border-indigo-600 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{s.label}</button>
                ))}
              </div>
            </section>

            {/* Pelos Faciais (Barba) */}
            <section className="space-y-6">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Estilo de Barba</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {facialHairStyles.map(s => (
                  <button key={s.value} onClick={() => setAppearance({...appearance, facialHair: s.value})} className={`py-4 rounded-2xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${appearance.facialHair === s.value ? 'bg-red-600/20 border-red-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{s.label}</button>
                ))}
              </div>
            </section>

            {/* Arte do Penteado */}
            <section className="space-y-6">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Penteado Régio</label>
              <div className="grid grid-cols-4 gap-3">
                {hairStyles.map((style) => (
                  <button key={style} onClick={() => setAppearance({...appearance, hairStyle: style})} className={`py-4 rounded-2xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${appearance.hairStyle === style ? 'bg-red-600/20 border-red-600 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{style}</button>
                ))}
              </div>
            </section>

            {/* Paleta de Cores */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center block">Pele</label>
                <div className="p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <input type="color" className="w-full h-10 rounded-xl bg-transparent cursor-pointer border-none" value={appearance.skinColor} onChange={e => setAppearance({...appearance, skinColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center block">Cabelo</label>
                <div className="p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <input type="color" className="w-full h-10 rounded-xl bg-transparent cursor-pointer border-none" value={appearance.hairColor} onChange={e => setAppearance({...appearance, hairColor: e.target.value, facialHairColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center block">Olhos</label>
                <div className="p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <input type="color" className="w-full h-10 rounded-xl bg-transparent cursor-pointer border-none" value={appearance.eyeColor} onChange={e => setAppearance({...appearance, eyeColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center block">Traje</label>
                <div className="p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <input type="color" className="w-full h-10 rounded-xl bg-transparent cursor-pointer border-none" value={appearance.outfitColor} onChange={e => setAppearance({...appearance, outfitColor: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Temperamento */}
            <section className="space-y-6">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Expressão Facial</label>
              <div className="flex gap-4 flex-wrap">
                {expressions.map((exp) => (
                  <button key={exp.value} onClick={() => setAppearance({...appearance, expression: exp.value})} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all ${appearance.expression === exp.value ? 'bg-red-600/20 border-red-600 scale-110 shadow-lg' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>{exp.emoji}</button>
                ))}
              </div>
            </section>
          </div>

          {/* BOTÃO FIXO DE FINALIZAÇÃO */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent pt-12 pb-6 px-4">
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); handleFinish(); }}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[13px] shadow-[0_0_50px_rgba(220,38,38,0.3)] transition-all active:scale-95 border-b-4 border-red-900 relative z-[220] cursor-pointer"
              >
                Consolidar Herói
              </button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #ef4444; }
      `}</style>
    </div>
  );
};

export default CharacterCreator;
