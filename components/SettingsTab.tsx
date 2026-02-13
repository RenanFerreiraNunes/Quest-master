
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
    const code = prompt("Cole o código da alma do herói que deseja importar para este reino:");
    if (code) {
      const success = db.importHero(code);
      if (success) alert("Herói importado com sucesso! Agora você pode encontrá-lo na aba Social.");
      else alert("Código inválido. Certifique-se de que copiou o código completo.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-20 px-4">
      <header className="text-center space-y-4">
        <h2 className="text-6xl font-rpg text-white uppercase tracking-tighter">Câmara de <span className="text-zinc-500">Ajustes</span></h2>
        <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[9px]">Configurações técnicas e manipulação de realidade</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preferências de Sistema */}
        <section className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] space-y-8 shadow-xl">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Preferências do Reino
          </h3>
          
          <div className="flex items-center justify-between p-6 bg-zinc-950/60 rounded-2xl border border-zinc-800">
            <div>
              <p className="text-sm font-black text-white">Efeitos Visuais</p>
              <p className="text-[10px] text-zinc-500">Animações e partículas</p>
            </div>
            <button 
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${animationsEnabled ? 'bg-indigo-600' : 'bg-zinc-800'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${animationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <button 
            onClick={onEditProfile}
            className="w-full py-5 bg-zinc-800 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-zinc-700 transition-all border-b-4 border-zinc-950"
          >
            Reforgar Identidade Visual
          </button>
        </section>

        {/* Consola de Runas (Cheats) */}
        <section className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] space-y-8 shadow-xl">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span> Consola de Runas
          </h3>
          
          <form onSubmit={handleSubmitCheat} className="space-y-4">
            <div className="bg-black p-4 rounded-xl border border-zinc-800 font-mono text-[10px] shadow-inner">
              <p className="text-emerald-500 mb-2">// Comandos Disponíveis:</p>
              <p className="text-zinc-500">/ouro - Ganha 1000G</p>
              <p className="text-zinc-500">/xp - Ganha 500XP</p>
              <p className="text-zinc-500">/vida - Cura Total</p>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Inserir Runa..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-indigo-400 text-xs outline-none focus:border-indigo-600 transition-all"
                value={cheatInput}
                onChange={e => setCheatInput(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-[8px] font-black uppercase hover:text-white">Exec</button>
            </div>
          </form>
        </section>

        {/* Portabilidade de Dados */}
        <section className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] space-y-8 shadow-xl">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Backup e Transferência
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950/60 p-6 rounded-3xl border border-zinc-800 space-y-4">
               <p className="text-[10px] font-black text-zinc-500 uppercase">Sua Alma Digital</p>
               <p className="text-xs text-zinc-400 leading-relaxed">Gere um código para levar seu herói para outro navegador ou para que amigos possam te adicionar.</p>
               <button 
                onClick={handleExport}
                className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${copyFeedback ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
               >
                 {copyFeedback ? 'Copiado para o Pergaminho!' : 'Exportar Código do Herói'}
               </button>
            </div>

            <div className="bg-zinc-950/60 p-6 rounded-3xl border border-zinc-800 space-y-4">
               <p className="text-[10px] font-black text-zinc-500 uppercase">Trazer Herói</p>
               <p className="text-xs text-zinc-400 leading-relaxed">Cole o código de um amigo para que ele passe a existir neste reino e vocês possam interagir.</p>
               <button 
                onClick={handleImport}
                className="w-full py-4 bg-zinc-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all"
               >
                 Importar Herói Externo
               </button>
            </div>
          </div>
        </section>

        {/* Informações de Conta */}
        <section className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center text-2xl opacity-40">
                🗝️
              </div>
              <div>
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Herói Registrado sob o Email</p>
                <p className="text-xl font-black text-white">{user.email}</p>
              </div>
           </div>
           
           <div className="flex gap-4 w-full md:w-auto">
             <button 
               onClick={onLogout}
               className="flex-1 md:flex-none px-10 py-5 border border-zinc-800 rounded-2xl text-[9px] font-black uppercase text-zinc-500 hover:text-red-500 hover:border-red-900/50 transition-all"
             >
               Sair da Guilda
             </button>
             <button 
               onClick={() => { if(confirm("ADVERTÊNCIA: Isso apagará toda sua jornada para sempre. Continuar?")) onResetData(); }}
               className="flex-1 md:flex-none px-10 py-5 bg-red-900/20 text-red-500 border border-red-900/30 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
             >
               Expurgar Dados
             </button>
           </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsTab;
