
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface SettingsTabProps {
  user: User;
  onEditProfile: () => void;
  onLogout: () => void;
  onResetData: () => void;
  onCheat: (command: string) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (val: boolean) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ 
  user, 
  onEditProfile, 
  onLogout, 
  onResetData, 
  onCheat,
  animationsEnabled,
  setAnimationsEnabled
}) => {
  const [cheatInput, setCheatInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleSubmitCheat = (e: React.FormEvent) => {
    e.preventDefault();
    onCheat(cheatInput);
    setCheatInput('');
  };

  const handleExport = () => {
    const code = db.exportHero(user.email);
    if (code) {
      navigator.clipboard.writeText(code);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleImport = () => {
    const code = prompt("Cole o código da alma do herói:");
    if (code) {
      const success = db.importHero(code);
      if (success) alert("Herói importado com sucesso!");
      else alert("Código inválido.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4">
      <header className="text-center space-y-4">
        <h2 className="text-6xl font-rpg text-white uppercase tracking-tighter">Câmara de <span className="text-zinc-500">Ajustes</span></h2>
        <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[9px]">Configurações técnicas e manipulação de realidade</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-zinc-900/40 border-2 border-zinc-800 p-10 rounded-[3rem] space-y-8 shadow-xl">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Preferências
          </h3>
          
          <div className="flex items-center justify-between p-6 bg-zinc-950/60 rounded-3xl border border-zinc-800">
            <div>
              <p className="text-sm font-black text-white">Animações de Fluidez</p>
              <p className="text-[10px] text-zinc-500">Partículas e transições</p>
            </div>
            <button 
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${animationsEnabled ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-zinc-800'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${animationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <button 
            onClick={onEditProfile}
            className="w-full py-5 bg-zinc-800 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-zinc-700 transition-all border-b-4 border-zinc-950"
          >
            Reforgar Avatar
          </button>
        </section>

        <section className="bg-zinc-900/40 border-2 border-zinc-800 p-10 rounded-[3rem] space-y-8 shadow-xl">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span> Consola de Runas
          </h3>
          
          <form onSubmit={handleSubmitCheat} className="space-y-4">
            <div className="bg-black p-4 rounded-xl border border-zinc-800 font-mono text-[9px] shadow-inner text-emerald-500">
              <p>// /ouro, /xp, /vida</p>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Inserir Runa..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-indigo-400 text-xs outline-none focus:border-indigo-600"
                value={cheatInput}
                onChange={e => setCheatInput(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-[8px] font-black uppercase hover:text-white">Exec</button>
            </div>
          </form>
        </section>

        <section className="md:col-span-2 bg-zinc-900/40 border-2 border-zinc-800 p-10 rounded-[3.5rem] space-y-8 shadow-xl">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Portabilidade
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={handleExport} className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${copyFeedback ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-zinc-200 shadow-xl'}`}>
              {copyFeedback ? 'Alma Copiada!' : 'Exportar Código da Alma'}
            </button>
            <button onClick={handleImport} className="py-5 bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Importar Herói Externo</button>
          </div>
        </section>

        <section className="md:col-span-2 bg-red-900/5 border-2 border-red-900/20 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
           <div>
              <p className="text-[10px] font-black text-red-900 uppercase tracking-widest">Zona de Perigo</p>
              <p className="text-xs text-zinc-500 mt-1">Ações irreversíveis que afetam o reino.</p>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
             <button onClick={onLogout} className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[9px] font-black uppercase hover:text-white">Desconectar</button>
             <button onClick={onResetData} className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase hover:bg-red-500 shadow-xl border-b-4 border-red-900">Resetar Tudo</button>
           </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsTab;
