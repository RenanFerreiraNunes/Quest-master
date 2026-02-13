
import React, { useState, useMemo } from 'react';
import { User, Guild, FriendRequest } from '../types';
import { db } from '../services/db';
import HeroAvatar from './HeroAvatar';

interface SocialTabProps {
  user: User;
  onUpdate: (u: User) => void;
}

const SocialTab: React.FC<SocialTabProps> = ({ user, onUpdate }) => {
  const [subTab, setSubTab] = useState<'amigos' | 'guildas' | 'ranking'>('amigos');
  const [search, setSearch] = useState('');
  const [guildName, setGuildName] = useState('');
  const [guildDesc, setGuildDesc] = useState('');

  const allUsers = useMemo(() => db.getAllUsers().filter(u => u.email !== user.email), [user.email]);
  const allGuilds = useMemo(() => db.getAllGuilds(), []);
  
  const searchResults = useMemo(() => {
    if (!search) return [];
    return allUsers.filter(u => u.nickname.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  }, [search, allUsers]);

  const myGuild = useMemo(() => allGuilds.find(g => g.id === user.guildId), [allGuilds, user.guildId]);

  const handleSendRequest = (toEmail: string) => {
    db.sendFriendRequest(user.email, toEmail);
    // Dispara evento manual caso esteja testando na mesma aba
    window.dispatchEvent(new Event('storage_sync'));
  };

  const handleAccept = (fromEmail: string) => {
    db.acceptFriendRequest(user.email, fromEmail);
    const updated = db.getUser(user.email);
    if (updated) onUpdate(updated);
  };

  const handleCreateGuild = () => {
    if (user.gold < 500) return alert('Você precisa de 500 moedas de ouro para fundar uma guilda.');
    const guild = db.createGuild(guildName, user.email, '🛡️', guildDesc);
    if (guild) {
      const updated = db.getUser(user.email);
      if (updated) onUpdate(updated);
      setGuildName('');
      setGuildDesc('');
    }
  };

  const handleJoinGuild = (id: string) => {
    db.joinGuild(id, user.email);
    const updated = db.getUser(user.email);
    if (updated) onUpdate(updated);
  };

  const handleLeaveGuild = () => {
    if (confirm("Deseja mesmo abandonar esta guilda?")) {
      db.leaveGuild(user.email);
      const updated = db.getUser(user.email);
      if (updated) onUpdate(updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <nav className="flex gap-4 border-b border-zinc-800 pb-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'amigos', label: 'Aliança', icon: '🤝' },
          { id: 'guildas', label: 'Ordens', icon: '🏰' },
          { id: 'ranking', label: 'Hall da Fama', icon: '🏆' }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${subTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-900/50 text-zinc-500 hover:text-white'}`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      {subTab === 'amigos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800">
              <h3 className="text-2xl font-rpg mb-6 text-white flex items-center gap-4">
                Localizar Heróis <span className="text-[10px] font-sans text-zinc-600 uppercase font-black tracking-widest">({allUsers.length} no reino)</span>
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Busque por apelido ou email..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              
              <div className="mt-8 space-y-4">
                {searchResults.map(u => {
                  const alreadyFriend = user.friends?.includes(u.email);
                  const alreadySent = u.friendRequests?.some(r => r.fromEmail === user.email);
                  return (
                    <div key={u.email} className="bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center overflow-hidden">
                          <HeroAvatar appearance={u.appearance} size={45} className="translate-y-2" />
                        </div>
                        <div>
                          <p className="font-black text-white">{u.nickname}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Lvl {u.level} {u.charClass}</p>
                        </div>
                      </div>
                      <button 
                        disabled={alreadyFriend || alreadySent}
                        onClick={() => handleSendRequest(u.email)}
                        className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${alreadyFriend ? 'bg-zinc-800 text-zinc-500' : alreadySent ? 'bg-zinc-800 text-amber-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg'}`}
                      >
                        {alreadyFriend ? 'Membro da Aliança' : alreadySent ? 'Pedido Enviado' : 'Enviar Pedido'}
                      </button>
                    </div>
                  );
                })}
                {search && searchResults.length === 0 && (
                  <p className="text-center text-zinc-600 text-xs py-10 italic">Nenhum herói encontrado com este nome.</p>
                )}
              </div>
            </section>

            <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800">
              <h3 className="text-2xl font-rpg mb-6 text-white">Sua Aliança</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.friends || []).map(fEmail => {
                  const friend = db.getUser(fEmail);
                  if (!friend) return null;
                  return (
                    <div key={fEmail} className="bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800 flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700">
                        <HeroAvatar appearance={friend.appearance} size={40} className="translate-y-1.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">{friend.nickname}</p>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase">Lvl {friend.level} {friend.charClass}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  );
                })}
                {(!user.friends || user.friends.length === 0) && (
                  <div className="col-span-full py-16 text-center space-y-4">
                    <p className="text-4xl opacity-20">🕯️</p>
                    <p className="text-zinc-600 text-xs italic">Você ainda não possui aliados nesta jornada.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
             <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800 sticky top-24">
               <h3 className="text-xl font-rpg mb-6 text-white text-center flex items-center justify-center gap-3">
                 Convites Pendentes {user.friendRequests?.length > 0 && <span className="w-5 h-5 bg-red-600 text-white text-[9px] rounded-full flex items-center justify-center animate-bounce">{user.friendRequests.length}</span>}
               </h3>
               <div className="space-y-4">
                 {(user.friendRequests || []).map(req => (
                   <div key={req.fromEmail} className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800 space-y-4 animate-in slide-in-from-right-2">
                     <p className="text-xs font-bold text-center text-zinc-300">Convite de <span className="text-indigo-400">{req.fromNickname}</span></p>
                     <div className="flex gap-2">
                       <button 
                        onClick={() => handleAccept(req.fromEmail)}
                        className="flex-1 py-3 bg-white text-black text-[8px] font-black uppercase rounded-lg hover:bg-zinc-200 shadow-lg"
                       >
                         Aceitar
                       </button>
                       <button className="flex-1 py-3 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase rounded-lg hover:text-white">Recusar</button>
                     </div>
                   </div>
                 ))}
                 {(!user.friendRequests || user.friendRequests.length === 0) && (
                   <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest py-10 opacity-30">Nenhum pedido</p>
                 )}
               </div>
             </section>
          </div>
        </div>
      )}

      {subTab === 'guildas' && (
        <div className="space-y-10">
          {!user.guildId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800 flex flex-col justify-between shadow-2xl">
                <div>
                  <h3 className="text-3xl font-rpg mb-4 text-white">Fundar Nova Ordem</h3>
                  <p className="text-zinc-500 text-sm mb-10 leading-relaxed font-medium">Reúna heróis sob um único estandarte para compartilhar a glória. Requer 500 moedas de ouro.</p>
                  <div className="space-y-6">
                    <input 
                      type="text" 
                      placeholder="Nome da Guilda..." 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500"
                      value={guildName}
                      onChange={e => setGuildName(e.target.value)}
                    />
                    <textarea 
                      placeholder="Descrição da guilda..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 min-h-[120px]"
                      value={guildDesc}
                      onChange={e => setGuildDesc(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  disabled={user.gold < 500}
                  onClick={handleCreateGuild}
                  className={`w-full py-6 mt-10 rounded-[2rem] font-black uppercase tracking-widest text-xs border-b-4 transition-all ${user.gold >= 500 ? 'bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-900 shadow-xl' : 'bg-zinc-800 text-zinc-600 border-zinc-950 cursor-not-allowed'}`}
                >
                  Fundar por 500G
                </button>
              </section>

              <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800">
                <h3 className="text-3xl font-rpg mb-10 text-white">Ordens do Reino</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                  {allGuilds.map(g => (
                    <div key={g.id} className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between group hover:border-indigo-500/50 transition-all shadow-lg">
                      <div className="flex items-center gap-6">
                        <div className="text-4xl drop-shadow-lg">{g.icon}</div>
                        <div>
                          <p className="text-lg font-black text-white">{g.name}</p>
                          <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest">{g.totalXp} Prestígio • {g.memberEmails.length} Membros</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleJoinGuild(g.id)}
                        className="px-8 py-3 bg-zinc-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                      >
                        Ingressar
                      </button>
                    </div>
                  ))}
                  {allGuilds.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                       <p className="text-5xl mb-4">🏰</p>
                       <p className="text-xs font-black uppercase tracking-widest">Nenhuma guilda ativa no momento.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="bg-zinc-900/30 p-12 rounded-[4rem] border border-zinc-800 relative overflow-hidden shadow-3xl">
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[150px] pointer-events-none" />
               <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                 <div className="space-y-8 flex-1">
                    <div className="flex items-center gap-8">
                       <span className="text-8xl drop-shadow-2xl">{myGuild?.icon}</span>
                       <div className="space-y-2">
                          <h2 className="text-7xl font-rpg text-white tracking-tighter uppercase">{myGuild?.name}</h2>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Ordem Nível {(Math.floor(myGuild?.totalXp || 0) / 1000).toFixed(0)}</p>
                       </div>
                    </div>
                    <p className="text-zinc-400 max-w-2xl font-medium italic text-lg leading-relaxed">"{myGuild?.description}"</p>
                    <div className="flex flex-wrap gap-10 pt-6">
                       <div className="text-center bg-zinc-950/40 px-10 py-6 rounded-3xl border border-zinc-800 shadow-inner">
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Prestígio</p>
                          <p className="text-4xl font-black text-indigo-400 font-mono">{myGuild?.totalXp}</p>
                       </div>
                       <div className="text-center bg-zinc-950/40 px-10 py-6 rounded-3xl border border-zinc-800 shadow-inner">
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Membros</p>
                          <p className="text-4xl font-black text-white">{myGuild?.memberEmails.length}</p>
                       </div>
                    </div>
                    <div className="pt-10 flex gap-4">
                       <button onClick={handleLeaveGuild} className="px-10 py-4 bg-red-900/20 text-red-500 border border-red-900/30 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Abandonar Ordem</button>
                    </div>
                 </div>

                 <div className="bg-zinc-950/60 p-10 rounded-[3rem] border border-zinc-800 flex-1 w-full lg:max-w-md shadow-2xl">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-4">
                       <span className="w-8 h-px bg-zinc-800"></span> Irmandade <span className="w-8 h-px bg-zinc-800"></span>
                    </h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                       {myGuild?.memberEmails.map(email => {
                         const m = db.getUser(email);
                         const isMaster = myGuild.masterEmail === email;
                         const isMe = user.email === email;
                         return (
                           <div key={email} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isMe ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-950">
                                 <HeroAvatar appearance={m?.appearance} size={40} className="translate-y-2" />
                               </div>
                               <div>
                                 <p className="text-xs font-black text-white">{m?.nickname || "Heroi Desconhecido"}</p>
                                 <p className="text-[8px] text-zinc-500 font-black uppercase">Lvl {m?.level}</p>
                               </div>
                             </div>
                             <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${isMaster ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                               {isMaster ? 'Mestre' : 'Membro'}
                             </span>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'ranking' && (
        <section className="bg-zinc-900/30 p-12 rounded-[4rem] border border-zinc-800 max-w-4xl mx-auto shadow-3xl">
           <header className="text-center mb-16">
             <h3 className="text-5xl font-rpg text-white mb-4 uppercase tracking-tighter">LENDAS DO <span className="text-indigo-500">REINO</span></h3>
             <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Os heróis com maior prestígio acumulado</p>
           </header>

           <div className="space-y-4">
             {allUsers.concat([user]).sort((a, b) => b.xp - a.xp).slice(0, 10).map((u, i) => (
               <div key={u.email} className={`p-8 rounded-[2rem] border-2 flex items-center justify-between transition-all hover:scale-[1.01] ${u.email === user.email ? 'bg-indigo-500/10 border-indigo-500 shadow-lg' : 'bg-zinc-950 border-zinc-800 shadow-md'}`}>
                 <div className="flex items-center gap-8">
                   <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-xl ${i === 0 ? 'bg-amber-500 text-black shadow-glow-amber' : i === 1 ? 'bg-zinc-400 text-black' : i === 2 ? 'bg-orange-800 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                     {i + 1}
                   </div>
                   <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900 shadow-inner">
                       <HeroAvatar appearance={u.appearance} size={60} className="translate-y-3" />
                     </div>
                     <div>
                       <p className="text-xl font-black text-white">{u.nickname}</p>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{u.charClass} Lvl {u.level}</p>
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Prestígio</p>
                   <p className="text-3xl font-black text-indigo-400 font-mono tracking-tighter">{u.xp.toFixed(0)} XP</p>
                 </div>
               </div>
             ))}
           </div>
        </section>
      )}

      <style>{`
        .shadow-glow-amber { box-shadow: 0 0 30px rgba(245, 158, 11, 0.4); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default SocialTab;
