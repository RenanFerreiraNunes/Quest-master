
import React, { useState, useEffect, useCallback } from 'react';
import { User, Task, Rarity, InventoryItem, Difficulty, CharacterClass, Appearance, EquipmentSlot, Skill } from './types';
import { db } from './services/db';
import { geminiService } from './services/gemini';
import { RARITIES, DIFFICULTIES, CLASSES, THEMES, INITIAL_SKILLS, CLASS_STATS, SHOP_ITEMS, CAMPAIGN_CHAPTERS, BASE_INVENTORY_CAPACITY } from './constants';
import StatsBar from './components/StatsBar';
import Shop from './components/Shop';
import HeroAvatar from './components/HeroAvatar';
import ChromaGrid from './components/ChromaGrid';
import ClickSpark from './components/ClickSpark';
import QuestStepper from './components/QuestStepper';
import SkillsManager from './components/SkillsManager';
import CharacterCreator from './components/CharacterCreator';
import CampaignTab from './components/CampaignTab';
import ItemDetailsModal from './components/ItemDetailsModal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'quests' | 'campaign' | 'shop' | 'inventory' | 'profile' | 'skills'>('quests');
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [damageEffect, setDamageEffect] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  
  const [aiMessage, setAiMessage] = useState<string>('O mestre da guilda observa sua coragem...');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sessionEmail = db.getSession();
    if (sessionEmail) {
      const userData = db.getUser(sessionEmail);
      if (userData) {
        setUser(userData);
        fetchAiGreeting(userData);
      }
    }
  }, []);

  const fetchAiGreeting = async (u: User) => {
    const msg = await geminiService.getMotivationalMessage(u.nickname, u.level, u.tasks.filter(t => !t.done).length);
    setAiMessage(msg);
  };

  const updateAndSave = useCallback((updated: User) => {
    if (updated.isBroken && updated.hp >= updated.maxHp) {
      updated.isBroken = false;
      alert("✨ Sua alma foi restaurada! Você pode aceitar novos contratos novamente.");
    }

    if (updated.hp <= 0 && !updated.isBroken) {
      const penalty = Math.floor(updated.gold * 0.1);
      updated.hp = Math.floor(updated.maxHp * 0.2); 
      updated.gold = Math.max(0, updated.gold - penalty);
      updated.tasks = updated.tasks.map(t => ({ ...t, startTime: null, isPaused: false, accumulatedTimeMs: 0 })); 
      alert(`☠️ Você sucumbiu à exaustão! A guilda cobrou ${penalty}G pelo resgate.`);
    }
    setUser(updated);
    db.saveUser(updated);
  }, []);

  const triggerDamage = () => {
    setDamageEffect(true);
    setTimeout(() => setDamageEffect(false), 500);
  };

  const handleStartTask = (taskId: string) => {
    if (!user || user.isBroken) return;
    updateAndSave({
      ...user,
      hp: user.hp - 5, 
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, startTime: Date.now(), isPaused: false } : t)
    });
  };

  const handlePauseTask = (taskId: string) => {
    if (!user) return;
    const task = user.tasks.find(t => t.id === taskId);
    if (!task || !task.startTime || task.isPaused) return;

    const elapsed = Date.now() - task.startTime;
    updateAndSave({
      ...user,
      hp: Math.max(1, user.hp - 2),
      tasks: user.tasks.map(t => t.id === taskId ? { 
        ...t, 
        startTime: null, 
        accumulatedTimeMs: t.accumulatedTimeMs + elapsed,
        isPaused: true 
      } : t)
    });
  };

  const handleResumeTask = (taskId: string) => {
    if (!user) return;
    updateAndSave({
      ...user,
      tasks: user.tasks.map(t => t.id === taskId ? { 
        ...t, 
        startTime: Date.now(), 
        isPaused: false 
      } : t)
    });
  };

  const handleCancelTask = (task: Task) => {
    if (!user) return;
    const config = RARITIES[task.rarity];
    const diff = DIFFICULTIES[task.difficulty];
    const hpLoss = Math.max(5, Math.floor((config.xp * diff.multiplier) * 0.2));
    const willBreak = user.hp - hpLoss <= 0;

    const msg = willBreak 
      ? `⚠️ EXAUSTÃO CRÍTICA: Desistir custará ${hpLoss} HP. Você ficará em estado espectral (HP 1) e bloqueado até se curar 100%! Continuar?`
      : `🛡️ PENALIDADE: Perderá ${hpLoss} HP. Confirmar?`;

    if (window.confirm(msg)) {
      triggerDamage();
      updateAndSave({
        ...user,
        hp: willBreak ? 1 : user.hp - hpLoss,
        isBroken: willBreak ? true : user.isBroken,
        tasks: user.tasks.filter(t => t.id !== task.id)
      });
    }
  };

  const completeTask = (task: Task) => {
    if (!user || task.done) return;
    let totalElapsedMs = task.accumulatedTimeMs + (task.startTime ? (Date.now() - task.startTime) : 0);
    
    if (totalElapsedMs < task.minDurationSeconds * 1000) {
       const damage = { comum: 10, raro: 25, epico: 50, lendario: 100 }[task.rarity] || 10;
       triggerDamage();
       updateAndSave({
         ...user,
         hp: Math.max(1, user.hp - damage),
         isBroken: (user.hp - damage <= 0) ? true : user.isBroken,
         tasks: user.tasks.map(t => t.id === task.id ? { ...t, startTime: null, isPaused: false, accumulatedTimeMs: 0 } : t)
       });
       alert(`💥 BACKLASH! Dano: ${damage}.`);
       return;
    }

    const rConfig = RARITIES[task.rarity];
    const dConfig = DIFFICULTIES[task.difficulty];
    const classBase = CLASS_STATS[user.charClass];
    const earnedXp = Math.floor(rConfig.xp * dConfig.multiplier * classBase.xpMod);
    const earnedGold = Math.floor(rConfig.gold * dConfig.multiplier * classBase.goldMod);
    
    let newXp = user.xp + earnedXp;
    let newLevel = user.level;
    while (newXp >= newLevel * 200) { newXp -= (newLevel * 200); newLevel++; }

    updateAndSave({ 
      ...user, 
      tasks: user.tasks.map(t => t.id === task.id ? { ...t, done: true, doneAt: Date.now(), startTime: null, isPaused: false } : t), 
      xp: newXp, level: newLevel, gold: user.gold + earnedGold,
      hp: Math.min(user.maxHp, user.hp + 2)
    });
  };

  const handleLogin = () => {
    if (!email) return;
    let existing = db.getUser(email);
    if (!existing) setIsCreatingCharacter(true);
    else {
      db.setSession(email);
      setUser(existing);
      fetchAiGreeting(existing);
    }
  };

  const handleCharacterCreation = (data: { nickname: string, charClass: CharacterClass, appearance: Appearance }) => {
    const stats = CLASS_STATS[data.charClass];
    const newUser: User = {
      email, nickname: data.nickname, charClass: data.charClass, avatar: '🛡️', appearance: data.appearance,
      xp: 0, level: 1, gold: 100, hp: stats.hp, maxHp: stats.hp, isBroken: false,
      inventoryCapacity: BASE_INVENTORY_CAPACITY, activeTheme: 'theme-default', tasks: [], inventory: [],
      skills: INITIAL_SKILLS, equippedSkills: [], equipment: { head: null, body: null, acc1: null, acc2: null, special: null },
      campaignProgress: 0
    };
    db.saveUser(newUser);
    db.setSession(email);
    setUser(newUser);
    setIsCreatingCharacter(false);
  };

  const handleEquipItem = (item: InventoryItem) => {
    if (!user || !item.slot) return;
    const currentEquipped = user.equipment[item.slot];
    const newEquipment = { ...user.equipment, [item.slot]: currentEquipped === item.id ? null : item.id };
    updateAndSave({ ...user, equipment: newEquipment });
  };

  const handleUseItem = (item: InventoryItem) => {
    if (!user) return;
    if (item.type === 'buff') {
      const heal = item.id === 'potion-0' ? 5 : 20;
      updateAndSave({
        ...user,
        hp: Math.min(user.maxHp, user.hp + heal),
        inventory: user.inventory.filter((_, i) => user.inventory[i] !== item)
      });
      setSelectedInventoryItem(null);
    }
  };

  if (isCreatingCharacter) return <CharacterCreator onComplete={handleCharacterCreation} />;
  if (!user) return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-950">
      <ChromaGrid color="rgba(220, 38, 38, 0.1)" />
      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800 p-10 rounded-[3rem] shadow-3xl text-center">
        <h1 className="text-5xl font-rpg mb-10 text-white font-black uppercase tracking-tighter">QUEST<span className="text-red-600">MASTER</span></h1>
        <input type="email" placeholder="Email do Herói" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-white mb-4 text-center" value={email} onChange={e => setEmail(e.target.value)} />
        <button onClick={handleLogin} className="w-full bg-red-600 py-5 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-xs">Entrar no Reino</button>
      </div>
    </div>
  );

  return (
    <ClickSpark>
      <div className={`h-screen flex flex-col md:flex-row text-zinc-100 ${currentTheme.bg} overflow-hidden ${damageEffect || user.isBroken ? 'ring-inset ring-8 ring-red-900/40' : ''}`}>
        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-6 flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="flex flex-col items-center mb-10 gap-6">
            <div className="relative group">
              <div className={`w-36 h-36 rounded-[3.5rem] bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-3xl overflow-hidden ${damageEffect ? 'animate-shake' : ''}`}>
                <HeroAvatar appearance={{...user.appearance, expression: user.isBroken ? 'tired' : user.appearance.expression}} user={user} size={110} />
              </div>
              <div className={`absolute -top-3 -right-3 w-12 h-12 bg-${currentTheme.primary} rounded-2xl border-4 border-zinc-900 flex items-center justify-center text-xl`}>
                {user.isBroken ? '💀' : user.avatar}
              </div>
            </div>
            <div className="text-center">
              <h1 className="font-rpg text-3xl font-black">{user.nickname}</h1>
              <p className={`text-[9px] uppercase font-black tracking-[0.4em] mt-2 ${currentTheme.text}`}>NÍVEL {user.level}</p>
            </div>
          </div>
          <div className="space-y-6 flex-1">
            <StatsBar label="Vitalidade" current={user.hp} max={user.maxHp} color={user.isBroken ? "bg-zinc-700 animate-pulse" : (user.hp < 20 ? "bg-red-800 animate-pulse" : "bg-red-600")} icon="❤️" />
            <StatsBar label="Alma (XP)" current={user.xp} max={user.level * 200} color={`bg-${currentTheme.primary}`} icon="✨" />
            <div className="bg-zinc-800/40 p-5 rounded-[2rem] border border-zinc-700/30 flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tesouro</span>
              <span className="text-amber-400 font-black text-2xl">💰 {user.gold}</span>
            </div>
          </div>
          <p className="text-[10px] italic text-zinc-600 text-center mb-4 px-2">"{aiMessage}"</p>
          <button onClick={() => { db.logout(); window.location.reload(); }} className="py-4 rounded-2xl border border-zinc-800 text-[9px] font-black uppercase text-zinc-600 hover:text-red-500 tracking-[0.3em]">Retirar-se</button>
        </aside>

        <main className="flex-1 overflow-y-auto relative p-4 md:p-10 z-10 scrollbar-hide">
          <ChromaGrid color={currentTheme.primary === 'red-600' ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255,255,255,0.03)'} />
          <nav className="flex items-center gap-4 mb-12 overflow-x-auto pb-6 sticky top-0 z-40 bg-zinc-950/20 backdrop-blur-md">
            {[
              {id:'quests',l:'Quests',i:'⚔️'},
              {id:'campaign',l:'Mapa',i:'🗺️'},
              {id:'skills',l:'Poderes',i:'🔥'},
              {id:'shop',l:'Bazar',i:'💎'},
              {id:'inventory',l:'Mochila',i:'🎒'},
              {id:'profile',l:'Perfil',i:'🎭'}
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-3xl scale-105':'bg-zinc-900/40 text-zinc-500 hover:bg-zinc-800'}`}>
                <span>{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'quests' && (
            <div className="max-w-5xl mx-auto space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!user.isBroken && (
                  <button onClick={()=>setShowQuestCreator(true)} className="bg-zinc-900/20 border-4 border-dashed border-zinc-800 p-8 rounded-[3rem] flex items-center gap-6 hover:border-red-600/30">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl">＋</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Nova Quest</span>
                  </button>
                )}
                {user.isBroken && (
                  <div className="col-span-full p-10 bg-zinc-900/40 border-4 border-dashed border-red-900/20 rounded-[3rem] text-center">
                    <p className="text-4xl mb-4">💀</p>
                    <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em]">Exaustão Crítica: Cure-se 100% para novas quests</p>
                  </div>
                )}
              </div>

              {showQuestCreator && <QuestStepper onCancel={()=>setShowQuestCreator(false)} onComplete={data => {
                const task: Task = {
                  id: Math.random().toString(36).substr(2,9), title: data.title, rarity: data.rarity, difficulty: data.difficulty,
                  durationMinutes: data.duration, minDurationSeconds: data.minDurationSeconds,
                  startTime: null, accumulatedTimeMs: 0, isPaused: false, done: false, createdAt: Date.now()
                };
                updateAndSave({...user, tasks: [task, ...user.tasks]});
                setShowQuestCreator(false);
              }} />}

              <section className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Mural de Contratos</h3>
                {user.tasks.filter(t => !t.done).map(task => {
                  const config = RARITIES[task.rarity];
                  const diff = DIFFICULTIES[task.difficulty];
                  let totalElapsedMs = task.accumulatedTimeMs + (task.startTime ? (currentTime - task.startTime) : 0);
                  const progress = Math.min(100, (totalElapsedMs / (task.minDurationSeconds * 1000)) * 100);
                  const timeLeft = Math.max(0, Math.floor(task.minDurationSeconds - (totalElapsedMs / 1000)));

                  return (
                    <div key={task.id} className={`p-8 border-2 ${config.color} ${config.bg} rounded-[3.5rem] relative overflow-hidden shadow-xl`}>
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div className="flex-1 space-y-4">
                           <h3 className="text-3xl font-rpg font-black">{task.title}</h3>
                           <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                             <span className="text-amber-500">💰 {Math.floor(config.gold * diff.multiplier)}G</span>
                             <span className="text-indigo-400">✨ {Math.floor(config.xp * diff.multiplier)}XP</span>
                           </div>
                           {(task.startTime || task.isPaused) && (
                             <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-zinc-800">
                               <div className={`h-full ${task.isPaused ? 'bg-zinc-600' : 'bg-red-600'} transition-all`} style={{width: `${progress}%`}} />
                             </div>
                           )}
                        </div>
                        <div className="flex items-center gap-4">
                          {!task.startTime && !task.isPaused ? (
                            <button onClick={()=>handleStartTask(task.id)} className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl">Iniciar</button>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-2xl font-black">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
                              <button onClick={task.startTime ? ()=>handlePauseTask(task.id) : ()=>handleResumeTask(task.id)} className="p-5 bg-zinc-800 rounded-2xl">{task.startTime ? '⏸' : '▶️'}</button>
                              <button disabled={progress<100} onClick={()=>completeTask(task)} className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest ${progress>=100?'bg-white text-black':'bg-zinc-800 text-zinc-600'}`}>Concluir</button>
                            </div>
                          )}
                          <button onClick={()=>handleCancelTask(task)} className="p-4 hover:bg-red-600/20 text-zinc-600 hover:text-red-500 rounded-2xl">✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-12">
              <header className="space-y-4">
                <h2 className="text-4xl font-rpg uppercase">Sua <span className="text-indigo-500">Mochila</span></h2>
                <div className="flex gap-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                   <span>Espaço: {user.inventory.length} / {user.inventoryCapacity}</span>
                </div>
              </header>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {user.inventory.map((item, idx) => (
                  <div key={idx} onClick={() => setSelectedInventoryItem(item)} className={`bg-zinc-900/40 p-6 rounded-[2rem] border-2 cursor-pointer transition-all hover:scale-105 ${user.equipment.head === item.id || user.equipment.body === item.id || user.equipment.acc1 === item.id || user.equipment.acc2 === item.id || user.equipment.special === item.id ? 'border-indigo-500 shadow-lg' : 'border-zinc-800'}`}>
                    <span className="text-5xl block text-center mb-4">{item.icon}</span>
                    <h4 className="text-[10px] font-black uppercase text-center truncate">{item.name}</h4>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, user.inventoryCapacity - user.inventory.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[2rem] h-32 flex items-center justify-center opacity-30">
                    <span className="text-zinc-800">vazio</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
               <header className="space-y-4 text-center md:text-left">
                 <h2 className="text-5xl font-rpg uppercase tracking-tighter">Refúgio do <span className={currentTheme.text}>Herói</span></h2>
                 <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">Customize sua aparência e codinome</p>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-zinc-900/20 p-10 rounded-[4rem] border border-zinc-800">
                 <div className="space-y-8">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Codinome</label>
                     <input type="text" value={user.nickname} onChange={e => updateAndSave({...user, nickname: e.target.value})} className="w-full bg-zinc-900 p-5 rounded-2xl outline-none border border-zinc-800 focus:border-red-600 font-bold" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Expressão Facial</label>
                     <div className="grid grid-cols-3 gap-2">
                       {['neutral', 'happy', 'focused', 'grin', 'tired'].map(ex => (
                         <button key={ex} onClick={() => updateAndSave({...user, appearance: {...user.appearance, expression: ex as any}})} className={`py-3 rounded-xl text-[9px] font-black uppercase ${user.appearance.expression === ex ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>{ex}</button>
                       ))}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <span className="text-[10px] text-zinc-600 uppercase font-black">Pele</span>
                       <input type="color" value={user.appearance.skinColor} onChange={e => updateAndSave({...user, appearance: {...user.appearance, skinColor: e.target.value}})} className="w-full h-10 rounded-xl bg-zinc-800 p-1 cursor-pointer" />
                     </div>
                     <div className="space-y-2">
                       <span className="text-[10px] text-zinc-600 uppercase font-black">Cabelo</span>
                       <input type="color" value={user.appearance.hairColor} onChange={e => updateAndSave({...user, appearance: {...user.appearance, hairColor: e.target.value}})} className="w-full h-10 rounded-xl bg-zinc-800 p-1 cursor-pointer" />
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center justify-center">
                   <div className="w-64 h-64 bg-zinc-950 rounded-[4rem] border-2 border-zinc-800 flex items-center justify-center shadow-2xl relative">
                     <HeroAvatar appearance={user.appearance} user={user} size={200} />
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'campaign' && <CampaignTab user={user} onClaim={(id) => {
            const mission = CAMPAIGN_CHAPTERS.find(m => m.id === id);
            if (mission) {
              let newXp = user.xp + mission.xpReward;
              let newLevel = user.level;
              while (newXp >= newLevel * 200) { newXp -= (newLevel * 200); newLevel++; }
              updateAndSave({ ...user, xp: newXp, level: newLevel, gold: user.gold + mission.goldReward, campaignProgress: user.campaignProgress + 1 });
            }
          }} />}
          {activeTab === 'shop' && <Shop user={user} onPurchase={(item) => {
            if (user.gold >= item.price) updateAndSave({...user, gold: user.gold - item.price, inventory: [...user.inventory, item]});
          }} />}
          {activeTab === 'skills' && <SkillsManager user={user} onUpgrade={(id) => {
            const skill = user.skills.find(s => s.id === id);
            if (!skill) return;
            const cost = Math.floor(skill.xpCostBase * Math.pow(1.5, skill.level));
            if (user.xp >= cost) updateAndSave({ ...user, xp: user.xp - cost, skills: user.skills.map(s => s.id === id ? { ...s, level: s.level + 1 } : s) });
          }} onEquip={(id) => {
            const isEquipped = user.equippedSkills.includes(id);
            if (isEquipped) updateAndSave({ ...user, equippedSkills: user.equippedSkills.filter(s => s !== id) });
            else if (user.equippedSkills.length < 2) updateAndSave({ ...user, equippedSkills: [...user.equippedSkills, id] });
          }} onUseActive={(id) => {
            if (id === 'meditation') updateAndSave({ ...user, hp: Math.min(user.maxHp, user.hp + 10) });
          }} />}

          {selectedInventoryItem && (
            <ItemDetailsModal 
              item={selectedInventoryItem} user={user} onClose={() => setSelectedInventoryItem(null)} 
              onAction={selectedInventoryItem.type === 'buff' ? handleUseItem : handleEquipItem}
              actionLabel={selectedInventoryItem.type === 'buff' ? 'Consumir' : (Object.values(user.equipment).includes(selectedInventoryItem.id) ? 'Remover' : 'Equipar')}
            />
          )}
        </main>
      </div>
    </ClickSpark>
  );
};

export default App;
