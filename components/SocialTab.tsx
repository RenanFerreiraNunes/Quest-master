
import React, { useState, useMemo, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGuilds, setAllGuilds] = useState<Guild[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const users = await db.getAllUsers();
      setAllUsers(users.filter(u => u.email !== user?.email));
      const guilds = await db.getAllGuilds();
      setAllGuilds(guilds);
    };
    fetchData();
  }, [user?.email, subTab]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    return allUsers.filter(u => 
      u.nickname.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, allUsers]);

  const myGuild = useMemo(() => allGuilds.find(g => g.id === user?.guildId), [allGuilds, user?.guildId]);

  const handleSendRequest = async (toEmail: string) => {
    setIsLoading(true);
    await db.sendFriendRequest(user.email, toEmail);
    const updated = await db.getUser(user.email);
    if (updated) onUpdate(updated);
    setIsLoading(false);
  };

  const handleAccept = async (fromEmail: string) => {
    setIsLoading(true);
    await db.acceptFriendRequest(user.email, fromEmail);
    const updated = await db.getUser(user.email);
    if (updated) onUpdate(updated);
    setIsLoading(false);
  };

  const handleCreateGuild = async () => {
    if (!guildName) return alert("Sua guilda precisa de um nome!");
    if (user.gold < 500) return alert('Você precisa de 500 moedas de ouro para fundar uma guilda.');
    const guild = await db.createGuild(guildName, user.email, '🛡️', guildDesc);
    if (guild) {
      const updated = await db.getUser(user.email);
      if (updated) onUpdate(updated);
      setGuildName('');
      setGuildDesc('');
    }
  };

  const handleJoinGuild = async (id: string) => {
    setIsLoading(true);
    await db.joinGuild(id, user.email);
    const updated = await db.getUser(user.email);
    if (updated) onUpdate(updated);
    setIsLoading(false);
  };

  const handleLeaveGuild = async () => {
    if (confirm("Deseja mesmo abandonar esta guilda?")) {
      setIsLoading(true);
      await db.leaveGuild(user.email);
      const updated = await db.getUser(user.email);
      if (updated) onUpdate(updated);
      setIsLoading(false);
    }
  };

  const safeFriends = user?.friends || [];
  const safeFriendRequests = user?.friendRequests || [];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 relative">
      {isLoading && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-[50] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <nav className="flex gap-4 border-b border-zinc-800 pb-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'amigos', label: 'Aliança', icon: '🤝' },
          { id: 'guildas', label: 'Ordens', icon: '🏰' },
          { id: 'ranking', label: 'Hall da Fama', icon: '🏆' }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${subTab === t.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-zinc-900/50 text-zinc-500 hover:text-white'}`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      {subTab === 'amigos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800 shadow-2xl">
              <h3 className="text-2xl font-rpg mb-6 text-white flex items-center gap-4">
                Localizar Heróis <span className="text-[10px] font-sans text-zinc-600 uppercase font-black tracking-widest">({allUsers.length} no reino)</span>
              </h3>
              <input 
                type="text" 
                placeholder="Busque por apelido ou email..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
              />
              <div className="mt-8 space-y-4">
                {searchResults.map(u => {
                  const alreadyFriend = safeFriends.includes(u.email);
                  const alreadySent = u.friendRequests?.some(r => r.fromEmail === user?.email);
                  return (
                    <div key={u.email} className="bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
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
                        className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${alreadyFriend ? 'bg-zinc-800 text-emerald-500' : alreadySent ? 'bg-zinc-800 text-amber-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg active:scale-95'}`}
                      >
                        {alreadyFriend ? 'Membro da Aliança' : alreadySent ? 'Pedido Enviado' : 'Enviar Pedido'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800 shadow-xl">
              <h3 className="text-2xl font-rpg mb-6 text-white">Sua Aliança</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeFriends.map(fEmail => {
                  const friend = allUsers.find(u => u.email === fEmail) || (fEmail === user.email ? user : null);
                  if (!friend) return null;
                  return (
                    <div key={fEmail} className="bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800 flex items-center gap-4 group hover:border-indigo-500/30 transition-all cursor-pointer">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700">
                        <HeroAvatar appearance={friend.appearance} size={40} className="translate-y-1.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">{friend.nickname}</p>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase">Lvl {friend.level} {friend.charClass}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
          <div className="lg:col-span-4">
             <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800 sticky top-24 shadow-xl">
               <h3 className="text-xl font-rpg mb-6 text-white text-center">Convites Pendentes</h3>
               <div className="space-y-4">
                 {safeFriendRequests.map(req => (
                   <div key={req.fromEmail} className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800 space-y-4">
                     <p className="text-xs font-bold text-center text-zinc-300">Convite de <span className="text-indigo-400">{req.fromNickname}</span></p>
                     <div className="flex gap-2">
                       <button onClick={() => handleAccept(req.fromEmail)} className="flex-1 py-3 bg-white text-black text-[8px] font-black uppercase rounded-lg hover:bg-zinc-200">Aceitar</button>
                       <button className="flex-1 py-3 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase rounded-lg">Recusar</button>
                     </div>
                   </div>
                 ))}
               </div>
             </section>
          </div>
        </div>
      )}

      {subTab === 'guildas' && (
        <div className="space-y-10">
          {!user?.guildId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <h3 className="text-3xl font-rpg mb-4 text-white">Fundar Nova Ordem</h3>
                <div className="space-y-6">
                  <input type="text" placeholder="Nome da Guilda..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500" value={guildName} onChange={e => setGuildName(e.target.value)} />
                  <textarea placeholder="Descrição da guilda..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 min-h-[120px]" value={guildDesc} onChange={e => setGuildDesc(e.target.value)} />
                </div>
                <button disabled={(user?.gold || 0) < 500} onClick={handleCreateGuild} className={`w-full py-6 mt-10 rounded-[2rem] font-black uppercase text-xs border-b-4 transition-all ${ (user?.gold || 0) >= 500 ? 'bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-900' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>Fundar por 500G</button>
              </section>
              <section className="bg-zinc-900/30 p-10 rounded-[3rem] border border-zinc-800 shadow-xl">
                <h3 className="text-3xl font-rpg mb-10 text-white">Ordens do Reino</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                  {allGuilds.map(g => (
                    <div key={g.id} className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between group hover:border-indigo-500/50 transition-all shadow-lg">
                      <div className="flex items-center gap-6">
                        <div className="text-4xl">{g.icon}</div>
                        <div>
                          <p className="text-lg font-black text-white">{g.name}</p>
                          <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest">{g.totalXp} Prestígio • {g.memberEmails.length} Membros</p>
                        </div>
                      </div>
                      <button onClick={() => handleJoinGuild(g.id)} className="px-8 py-3 bg-zinc-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95">Ingressar</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="bg-zinc-900/30 p-12 rounded-[4rem] border border-zinc-800 shadow-3xl">
               <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                 <div className="space-y-8 flex-1">
                    <div className="flex items-center gap-8">
                       <span className="text-8xl">{myGuild?.icon}</span>
                       <div className="space-y-2">
                          <h2 className="text-7xl font-rpg text-white tracking-tighter uppercase">{myGuild?.name}</h2>
                          <p className="text-[10px] font-black text-indigo-400 uppercase">Ordem Nível {(Math.floor((myGuild?.totalXp || 0) / 1000)).toFixed(0)}</p>
                       </div>
                    </div>
                    <p className="text-zinc-400 max-w-2xl font-medium italic text-lg leading-relaxed">"{myGuild?.description || 'Nenhum lema definido.'}"</p>
                    <div className="pt-10 flex gap-4">
                       <button onClick={handleLeaveGuild} className="px-10 py-4 bg-red-900/20 text-red-500 border border-red-900/30 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Abandonar Ordem</button>
                    </div>
                 </div>
                 <div className="bg-zinc-950/60 p-10 rounded-[3rem] border border-zinc-800 flex-1 w-full lg:max-w-md shadow-2xl">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 text-center">Irmandade</h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                       {myGuild?.memberEmails.map(email => {
                         const m = allUsers.find(u => u.email === email) || (email === user.email ? user : null);
                         const isMaster = myGuild.masterEmail === email;
                         return (
                           <div key={email} className="flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700">
                                 <HeroAvatar appearance={m?.appearance} size={40} className="translate-y-2" />
                               </div>
                               <div>
                                 <p className="text-xs font-black text-white">{m?.nickname || "Herói Desconhecido"}</p>
                                 <p className="text-[8px] text-zinc-500 font-black">Lvl {m?.level || 1}</p>
                               </div>
                             </div>
                             <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${isMaster ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>{isMaster ? 'Mestre' : 'Membro'}</span>
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
           </header>
           <div className="space-y-4">
             {allUsers.concat([user]).filter(Boolean).sort((a, b) => b.xp - a.xp).slice(0, 10).map((u, i) => (
               <div key={u.email} className={`p-8 rounded-[2rem] border-2 flex items-center justify-between transition-all ${u.email === user?.email ? 'bg-indigo-500/10 border-indigo-500' : 'bg-zinc-950 border-zinc-800'}`}>
                 <div className="flex items-center gap-8">
                   <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl ${i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-zinc-400 text-black' : i === 2 ? 'bg-orange-800 text-white' : 'bg-zinc-900 text-zinc-500'}`}>{i + 1}</div>
                   <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-full border border-zinc-800 overflow-hidden">
                       <HeroAvatar appearance={u.appearance} size={60} className="translate-y-3" />
                     </div>
                     <div>
                       <p className="text-xl font-black text-white">{u.nickname}</p>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase">{u.charClass} Lvl {u.level}</p>
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-3xl font-black text-indigo-400 font-mono tracking-tighter">{u.xp.toFixed(0)} XP</p>
                 </div>
               </div>
             ))}
           </div>
        </section>
      )}
    </div>
  );
};

export default SocialTab;
