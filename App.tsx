
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Task, Rarity, InventoryItem, Difficulty, CharacterClass, Appearance, EquipmentSlot, Skill } from './types';
import { db } from './services/db';
import { supabase } from './services/supabase';
import { geminiService } from './services/gemini';
import { RARITIES, DIFFICULTIES, CLASSES, THEMES, INITIAL_SKILLS, CLASS_STATS, SHOP_ITEMS, CAMPAIGN_CHAPTERS, BASE_INVENTORY_CAPACITY, CLASS_ABILITIES } from './constants';
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
import SocialTab from './components/SocialTab';
import SettingsTab from './components/SettingsTab';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quests' | 'campaign' | 'shop' | 'inventory' | 'profile' | 'skills' | 'social' | 'settings'>('quests');
  const [questSubTab, setQuestSubTab] = useState<'active' | 'completed' | 'defeats'>('active');
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [damageEffect, setDamageEffect] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [taskToAbandon, setTaskToAbandon] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [exhaustionEndTime, setExhaustionEndTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [lastRecoveryTime, setLastRecoveryTime] = useState(Date.now());
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [abilityAnimation, setAbilityAnimation] = useState<string | null>(null);

  const isExhausted = exhaustionEndTime !== null && now < exhaustionEndTime;
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');
  const [aiMessage, setAiMessage] = useState<string>('O mestre da guilda observa sua coragem...');
  const [scrollPos, setScrollPos] = useState(0);

  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

  // Efeito para monitorar autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else { setUser(null); setIsLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (uid: string) => {
    const profile = await db.getCurrentProfile();
    if (profile) {
      setUser(profile);
      fetchAiGreeting(profile);
      const storedExhaustion = localStorage.getItem(`exhaustion_${profile.email}`);
      if (storedExhaustion) setExhaustionEndTime(parseInt(storedExhaustion));
      setIsCreatingCharacter(false);
    } else {
      setIsCreatingCharacter(true);
    }
    setIsLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Preencha todos os campos!");
    setAuthLoading(true);
    
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Verifique seu e-mail para confirmar o cadastro!");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    return (user.tasks || []).filter(t => {
      if (questSubTab === 'active' && t.done) return false;
      if (questSubTab === 'completed' && (!t.done || t.failed)) return false;
      if (questSubTab === 'defeats' && !t.failed) return false;
      if (rarityFilter !== 'all' && t.rarity !== rarityFilter) return false;
      if (diffFilter !== 'all' && t.difficulty !== diffFilter) return false;
      return true;
    });
  }, [user, questSubTab, rarityFilter, diffFilter]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateAndSave = useCallback(async (updated: User) => {
    const xpNeeded = updated.level * 200;
    if (updated.xp >= xpNeeded) { 
      updated.level += 1; 
      updated.xp -= xpNeeded; 
      updated.maxHp += 10; 
      updated.hp = updated.maxHp; 
    }
    if (updated.hp <= 0 && !updated.isBroken) {
      setDamageEffect(true); setTimeout(() => setDamageEffect(false), 500);
      updated.gold = Math.max(0, updated.gold - Math.floor(updated.gold * 0.1));
      updated.hp = 0; updated.isBroken = true; 
      const end = Date.now() + 60000;
      setExhaustionEndTime(end);
      localStorage.setItem(`exhaustion_${updated.email}`, end.toString());
    } 
    setUser(updated); 
    await db.saveUser(updated);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (!user) return;

      setUser(prev => {
        if (!prev) return null;
        let needsUpdate = false;
        let updatedUser = { ...prev };

        if (currentTime - lastRecoveryTime >= 30000) {
          if (updatedUser.hp < updatedUser.maxHp && !updatedUser.isBroken) {
            updatedUser.hp = Math.min(updatedUser.maxHp, updatedUser.hp + 2);
            needsUpdate = true;
          }
          setLastRecoveryTime(currentTime);
        }

        const updatedTasks = (updatedUser.tasks || []).map(t => {
          if (t.startTime && !t.isPaused && !t.done) {
            const targetMs = (t.durationMinutes || 5) * 60 * 1000;
            const tickDifference = currentTime - (t.lastTickTime || t.startTime);
            const newAccumulated = t.accumulatedTimeMs + tickDifference;
            if (newAccumulated !== t.accumulatedTimeMs) {
              needsUpdate = true;
              return { ...t, accumulatedTimeMs: Math.min(targetMs, newAccumulated), lastTickTime: currentTime };
            }
          }
          return t;
        });

        const isTimeUp = exhaustionEndTime && currentTime >= exhaustionEndTime;
        const isHealed = updatedUser.hp > 10 && updatedUser.isBroken;

        if (isTimeUp || isHealed) {
          updatedUser.isBroken = false;
          if (isTimeUp && updatedUser.hp <= 0) updatedUser.hp = Math.floor(updatedUser.maxHp * 0.2);
          setExhaustionEndTime(null);
          localStorage.removeItem(`exhaustion_${updatedUser.email}`);
          needsUpdate = true;
        }

        if (needsUpdate) {
          updatedUser.tasks = updatedTasks;
          db.saveUser(updatedUser);
          return updatedUser;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user, exhaustionEndTime, lastRecoveryTime]);

  const fetchAiGreeting = async (u: User) => {
    try { const msg = await geminiService.getMotivationalMessage(u.nickname, u.level, (u.tasks || []).filter(t => !t.done).length); setAiMessage(msg); } catch (e) { }
  };

  const handleQuestComplete = async (taskId: string, rarity: Rarity, difficulty: Difficulty) => {
    if (!user) return;
    const rarityCfg = RARITIES[rarity] || RARITIES.comum;
    const diffCfg = DIFFICULTIES[difficulty] || DIFFICULTIES.facil;
    const classStats = CLASS_STATS[user.charClass];
    
    let xpGain = rarityCfg.xp * diffCfg.multiplier * classStats.xpMod;
    let goldGain = rarityCfg.gold * diffCfg.multiplier * classStats.goldMod;
    
    const updatedUser = {
      ...user,
      gold: user.gold + goldGain,
      xp: user.xp + xpGain,
      tasks: (user.tasks || []).map(t => t.id === taskId ? { ...t, done: true, failed: false, doneAt: Date.now() } : t)
    };
    if (user.guildId) await db.addGuildXp(user.guildId, xpGain);
    await updateAndSave(updatedUser);
  };

  const useClassAbility = async () => {
    if (!user) return;
    const ability = CLASS_ABILITIES[user.charClass];
    const lastUse = user.lastAbilityUse?.[ability.id] || 0;
    const cooldownMs = ability.cooldownSeconds * 1000;
    
    if (Date.now() - lastUse < cooldownMs) {
      alert(`Habilidade em recarga! Faltam ${Math.ceil((cooldownMs - (Date.now() - lastUse)) / 1000)}s`);
      return;
    }

    let updatedUser = { ...user };
    updatedUser.lastAbilityUse = { ...user.lastAbilityUse, [ability.id]: Date.now() };
    setAbilityAnimation(ability.id);
    setTimeout(() => setAbilityAnimation(null), 2000);

    switch (user.charClass) {
      case 'Guerreiro':
        updatedUser.tasks = (user.tasks || []).map(t => {
          if (!t.done && t.startTime) {
            const targetMs = (t.durationMinutes || 5) * 60 * 1000;
            const boost = targetMs * 0.15;
            return { ...t, accumulatedTimeMs: Math.min(targetMs, t.accumulatedTimeMs + boost) };
          }
          return t;
        });
        break;
      case 'Mago':
        updatedUser.xp += 100;
        break;
      case 'Ladino':
        updatedUser.gold += 50;
        break;
      case 'Paladino':
        updatedUser.hp = Math.min(user.maxHp, user.hp + 30);
        break;
    }

    await updateAndSave(updatedUser);
  };

  const handlePauseToggle = async (taskId: string) => {
    if (!user) return;
    const updatedTasks = user.tasks.map(t => t.id === taskId ? { ...t, isPaused: !t.isPaused, lastTickTime: !t.isPaused ? Date.now() : t.lastTickTime } : t);
    await updateAndSave({ ...user, tasks: updatedTasks });
  };

  const confirmDeleteTask = async (taskId: string) => {
    if (!user) return;
    const updatedTasks = user.tasks.filter(t => t.id !== taskId);
    await updateAndSave({ ...user, tasks: updatedTasks });
    setTaskToDelete(null);
  };

  const handleCancelTask = async (taskId: string) => {
    if (!user) return;
    const task = user.tasks.find(t => t.id === taskId);
    if (!task) return;
    const penalty = RARITIES[task.rarity]?.hpCost || 5;
    const updatedUser = {
      ...user,
      hp: Math.max(0, user.hp - penalty),
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, done: true, failed: true, doneAt: Date.now(), startTime: null } : t)
    };
    await updateAndSave(updatedUser);
    setTaskToAbandon(null);
  };

  const handlePurchase = async (item: InventoryItem) => {
    if (!user || user.gold < item.price) return;
    let updated = { ...user };
    updated.gold -= item.price;
    const existingIdx = updated.inventory?.findIndex(i => i.id === item.id) ?? -1;
    if (item.type === 'buff' && existingIdx > -1) {
      const newInv = [...updated.inventory];
      newInv[existingIdx] = { ...newInv[existingIdx], quantity: (newInv[existingIdx].quantity || 1) + 1 };
      updated.inventory = newInv;
    } else {
      updated.inventory = [...(updated.inventory || []), { ...item, quantity: 1 }];
    }
    await updateAndSave(updated);
  };

  const handleEquipItem = async (item: InventoryItem) => {
    if (!user) return;
    let updated = { ...user };
    const safeEquipment = updated.equipment || { head: null, body: null, acc1: null, acc2: null, special: null };
    if (item.type === 'equipment' && item.slot) {
      const slot = item.slot;
      updated.equipment = { ...safeEquipment, [slot]: safeEquipment[slot] === item.id ? null : item.id };
    } else if (item.type === 'buff') {
      if (item.id === 'potion-0') updated.hp = Math.min(updated.maxHp, updated.hp + 5);
      if (item.id === 'potion-1') updated.hp = Math.min(updated.maxHp, updated.hp + 20);
      const idx = updated.inventory?.findIndex(i => i.id === item.id) ?? -1;
      if (idx > -1) {
        const newInv = [...updated.inventory];
        if (newInv[idx].quantity && newInv[idx].quantity > 1) newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - 1 };
        else newInv.splice(idx, 1);
        updated.inventory = newInv;
      }
    }
    await updateAndSave(updated);
    setSelectedInventoryItem(null);
  };

  const handleCheat = async (command: string) => {
    if (!user) return;
    let updated = { ...user };
    const cmd = command.trim().toLowerCase();
    if (cmd === '/ouro') updated.gold += 1000;
    else if (cmd === '/xp') updated.xp += 500;
    else if (cmd === '/vida') { updated.hp = updated.maxHp; updated.isBroken = false; setExhaustionEndTime(null); }
    else return;
    await updateAndSave(updated);
  };

  const getProfileNameClass = (name: string = "") => {
    const len = name.length;
    if (len > 16) return 'text-3xl md:text-5xl';
    if (len > 12) return 'text-4xl md:text-6xl';
    return 'text-5xl md:text-7xl';
  };

  if (isLoading) return (
    <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-8">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Sincronizando com o Reino...</p>
    </div>
  );

  // Tela de Autenticação Real
  if (!session) return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-zinc-950">
      <ChromaGrid color="rgba(220, 38, 38, 0.05)" />
      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-10 rounded-[3.5rem] shadow-3xl relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <h1 className="text-5xl font-rpg mb-8 text-white font-black uppercase tracking-tighter text-center">QUEST<span className="text-red-600">MASTER</span></h1>
        
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="flex bg-zinc-950/50 p-1.5 rounded-2xl border border-zinc-800 mb-4">
            <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}>Entrar</button>
            <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}>Cadastrar</button>
          </div>

          <input type="email" placeholder="Email do Herói" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 text-white text-center outline-none focus:ring-4 ring-red-600/30 font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha Mística" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 text-white text-center outline-none focus:ring-4 ring-red-600/30 font-bold" value={password} onChange={e => setPassword(e.target.value)} />
          
          <button disabled={authLoading} type="submit" className="w-full bg-red-600 py-6 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-red-500 active:scale-95 transition-all border-b-4 border-red-800 shadow-xl">
            {authLoading ? 'Processando...' : authMode === 'login' ? 'Entrar no Reino' : 'Criar Destino'}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-800"></div>
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Ou use magia externa</span>
          <div className="h-px flex-1 bg-zinc-800"></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full mt-6 flex items-center justify-center gap-4 bg-white py-5 rounded-2xl font-black text-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Entrar com Google
        </button>
      </div>
    </div>
  );

  if (isCreatingCharacter) return <CharacterCreator onComplete={async (data) => {
    const stats = CLASS_STATS[data.charClass] || CLASS_STATS.Guerreiro;
    const newUser: User = { 
      ...data, 
      email: session.user.email, 
      xp: 0, 
      level: 1, 
      gold: 100, 
      hp: stats.hp, 
      maxHp: stats.hp, 
      isBroken: false, 
      inventoryCapacity: BASE_INVENTORY_CAPACITY, 
      activeTheme: 'theme-default', 
      tasks: [], 
      inventory: [], 
      skills: INITIAL_SKILLS, 
      equippedSkills: [], 
      equipment: { head: null, body: null, acc1: null, acc2: null, special: null }, 
      campaignProgress: 0, 
      friends: [], 
      friendRequests: [], 
      guildId: null,
      lastAbilityUse: {}
    };
    await db.saveUser(newUser); 
    setUser(newUser); 
    setIsCreatingCharacter(false);
  }} />;

  if (isEditingProfile && user) return <CharacterCreator 
    initialData={{ nickname: user.nickname, charClass: user.charClass, appearance: user.appearance, avatar: user.avatar }}
    onComplete={async (data) => { await updateAndSave({ ...user, ...data }); setIsEditingProfile(false); }} 
    onCancel={() => setIsEditingProfile(false)}
  />;

  const currentAbility = user ? CLASS_ABILITIES[user.charClass] : null;
  const lastUseTime = user?.lastAbilityUse?.[currentAbility?.id || ''] || 0;
  const cooldownRemaining = currentAbility ? Math.max(0, (currentAbility.cooldownSeconds * 1000) - (Date.now() - lastUseTime)) : 0;
  const cooldownPercent = currentAbility ? (cooldownRemaining / (currentAbility.cooldownSeconds * 1000)) * 100 : 0;

  return (
    <ClickSpark>
      <div className={`h-screen flex flex-col md:flex-row text-zinc-100 ${currentTheme.bg} transition-all duration-700 overflow-hidden relative`}>
        {abilityAnimation && (
           <div className="fixed inset-0 z-[500] pointer-events-none flex items-center justify-center">
              <div className="text-9xl animate-ping opacity-50">{currentAbility?.icon}</div>
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
           </div>
        )}

        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-6 flex flex-col h-full z-10">
          <div className="flex flex-col items-center mb-8 gap-4">
            <div className={`w-28 h-28 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden ${damageEffect || isExhausted ? 'animate-shake' : ''}`}>
              <HeroAvatar appearance={user?.appearance} user={user!} size={110} />
            </div>
            <div className="text-center">
              <h1 className="font-rpg text-xl font-black">{user?.nickname}</h1>
              <div className={`px-3 py-1 mt-1 rounded-full bg-zinc-900 border border-zinc-800 text-[7px] uppercase font-black tracking-widest text-red-600`}>
                Lvl {user?.level} {user?.charClass}
              </div>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <StatsBar label="Vida" current={user?.hp || 0} max={user?.maxHp || 100} color="bg-red-600" icon="❤️" />
            <StatsBar label="XP" current={user?.xp || 0} max={(user?.level || 1) * 200} color={`bg-${currentTheme.primary}`} icon="✨" />
            
            <div className="flex gap-2">
               <div className="flex-1 bg-zinc-800/30 p-3 rounded-2xl border border-zinc-700/30 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-amber-400">💰 {user?.gold}</span>
               </div>
               <div className="flex-1 bg-zinc-800/30 p-3 rounded-2xl border border-zinc-700/30 flex justify-center items-center">
                 <span className="text-[10px] font-black uppercase text-indigo-400">🎒 {(user?.inventory || []).length}/{user?.inventoryCapacity}</span>
               </div>
            </div>

            {currentAbility && (
               <div className="mt-4 p-4 bg-zinc-950 rounded-[2rem] border border-zinc-800 relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Poder de Classe</span>
                     {cooldownRemaining > 0 && <span className="text-[8px] font-black text-red-500">{Math.ceil(cooldownRemaining/1000)}s</span>}
                  </div>
                  <button 
                    disabled={cooldownRemaining > 0 || isExhausted}
                    onClick={useClassAbility}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${cooldownRemaining > 0 ? 'bg-zinc-900 grayscale opacity-40' : 'bg-white text-black hover:scale-[1.02] shadow-xl active:scale-95'}`}
                  >
                    <span className="text-xl">{currentAbility.icon}</span>
                    <span className="text-[10px] font-black uppercase">{currentAbility.name}</span>
                  </button>
                  {cooldownRemaining > 0 && (
                     <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-100" style={{ width: `${cooldownPercent}%` }} />
                  )}
               </div>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3">
             <button onClick={()=>setActiveTab('settings')} className={`w-full py-3 rounded-xl border border-zinc-800 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${activeTab==='settings'?'bg-white text-black':'hover:text-white'}`}>⚙️ Ajustes</button>
             <button onClick={()=>{db.logout(); window.location.reload();}} className="w-full py-3 rounded-xl border border-zinc-800 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-all active:scale-95">Sair</button>
          </div>
        </aside>

        <main onScroll={e => setScrollPos(e.currentTarget.scrollTop)} className="flex-1 overflow-y-auto relative p-6 md:p-10 z-10 scrollbar-hide">
          <ChromaGrid scrollOffset={scrollPos} color={`rgba(220, 38, 38, 0.03)`} />
          
          <nav className="flex items-center gap-3 mb-10 overflow-x-auto pb-4 sticky top-0 z-[100] bg-transparent backdrop-blur-md">
            {[ 
              {id:'quests',l:'Missões',i:'⚔️'}, 
              {id:'campaign',l:'História',i:'🗺️'}, 
              {id:'shop',l:'Bazar',i:'💎'}, 
              {id:'inventory',l:'Mochila',i:'🎒'}, 
              {id:'skills',l:'Talentos',i:'🔥'}, 
              {id:'social',l:'Social',i:'🤝'},
              {id:'profile',l:'Herói',i:'🎭'} 
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-5 py-4 rounded-[1.8rem] text-[8px] font-black uppercase tracking-widest transition-all active:scale-90 flex items-center gap-2 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-xl scale-105':'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                <span>{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'profile' && (
            <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500 relative z-20 px-4 md:px-8">
               <div className="bg-zinc-950/40 backdrop-blur-3xl border-2 border-zinc-900 rounded-[4rem] md:rounded-[5.5rem] p-8 md:p-14 overflow-hidden shadow-3xl">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch">
                     <div className="lg:col-span-5 flex flex-col items-center bg-zinc-900/20 border border-zinc-800 rounded-[4.5rem] p-10 md:p-14 gap-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[80px]" />
                        <div className="w-full aspect-square bg-zinc-950 rounded-[3.5rem] border-2 border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner shrink-0 relative z-10 transition-transform group-hover:scale-[1.02] duration-500">
                          <HeroAvatar appearance={user?.appearance} user={user!} size={340} className="translate-y-12" />
                        </div>
                        <div className="text-center space-y-6 w-full px-2 relative z-10 overflow-hidden">
                           <h2 className={`${getProfileNameClass(user?.nickname)} font-rpg font-black text-white tracking-tighter uppercase break-words leading-none drop-shadow-2xl transition-all duration-500`}>
                             {user?.nickname}
                           </h2>
                           <div className="flex justify-center">
                             <span className="px-8 py-2.5 bg-red-950/40 text-red-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-red-900/50 shadow-lg">
                               Lvl {user?.level} • {user?.charClass}
                             </span>
                           </div>
                        </div>
                        <button onClick={()=>setIsEditingProfile(true)} className="w-full py-6.5 bg-white text-black rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 transition-all mt-auto relative z-10">
                          Alterar Aparência
                        </button>
                     </div>
                     <div className="lg:col-span-7 flex flex-col gap-8 md:gap-12">
                        <div className="bg-zinc-900/20 border border-zinc-800 rounded-[4.5rem] p-10 md:p-14 flex-1 flex flex-col shadow-inner">
                           <h4 className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.6em] text-center flex items-center gap-6 justify-center mb-14 opacity-50">
                             <span className="w-12 md:w-20 h-px bg-zinc-800"></span> Status do Herói <span className="w-12 md:w-20 h-px bg-zinc-800"></span>
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8 flex-1 content-start">
                              <div className="p-8 md:p-10 bg-zinc-950/60 rounded-[3rem] border border-zinc-800 text-center flex flex-col justify-center items-center group hover:border-red-500/30 transition-all shadow-inner min-h-[160px] md:min-h-[180px]">
                                <span className="text-[8px] font-black text-red-500 uppercase block mb-3 tracking-[0.3em] opacity-80">Vitalidade</span>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-5xl md:text-6xl font-black text-white leading-none tabular-nums">{user?.hp}</p>
                                  <span className="text-zinc-700 text-2xl font-light">/</span>
                                  <p className="text-2xl md:text-3xl font-black text-zinc-500 tabular-nums">{user?.maxHp}</p>
                                </div>
                              </div>
                              <div className="p-8 md:p-10 bg-zinc-950/60 rounded-[3rem] border border-zinc-800 text-center flex flex-col justify-center items-center group hover:border-amber-500/30 transition-all shadow-inner min-h-[160px] md:min-h-[180px]">
                                <span className="text-[8px] font-black text-amber-500 uppercase block mb-3 tracking-[0.3em] opacity-80">Tesouro</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-5xl md:text-6xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">💰</span>
                                  <p className="text-5xl md:text-6xl font-black text-amber-500 leading-none tabular-nums">{user?.gold}</p>
                                </div>
                              </div>
                              <div className="p-8 md:p-10 bg-zinc-950/60 rounded-[3rem] border border-zinc-800 text-center flex flex-col justify-center items-center group hover:border-indigo-400/30 transition-all shadow-inner min-h-[160px] md:min-h-[180px]">
                                <span className="text-[8px] font-black text-indigo-400 uppercase block mb-3 tracking-[0.3em] opacity-80">Mochila</span>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-5xl md:text-6xl font-black text-indigo-400 leading-none tabular-nums">{(user?.inventory || []).length}</p>
                                  <span className="text-zinc-700 text-2xl font-light">/</span>
                                  <p className="text-2xl md:text-3xl font-black text-zinc-500 tabular-nums">{user?.inventoryCapacity}</p>
                                </div>
                              </div>
                              <div className="p-8 md:p-10 bg-zinc-950/60 rounded-[3rem] border border-zinc-800 text-center flex flex-col justify-center items-center group hover:border-emerald-400/30 transition-all shadow-inner min-h-[160px] md:min-h-[180px]">
                                <span className="text-[8px] font-black text-emerald-400 uppercase block mb-3 tracking-[0.3em] opacity-80">Vitórias</span>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-5xl md:text-6xl font-black text-emerald-400 leading-none tabular-nums">{(user?.tasks || []).filter(t=>t.done && !t.failed).length}</p>
                                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Feitos</span>
                                </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'quests' && (
             <div className="max-w-5xl mx-auto space-y-8 pb-32 relative z-[20]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                  <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                    <button onClick={() => setQuestSubTab('active')} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${questSubTab === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Mural</button>
                    <button onClick={() => setQuestSubTab('completed')} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${questSubTab === 'completed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Grimório</button>
                    <button onClick={() => setQuestSubTab('defeats')} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${questSubTab === 'defeats' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Derrotas</button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value as any)} className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-[8px] font-black uppercase tracking-widest outline-none transition-all">
                      <option value="all">Todas Raridades</option>
                      {Object.keys(RARITIES).map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                    <select value={diffFilter} onChange={e => setDiffFilter(e.target.value as any)} className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-[8px] font-black uppercase tracking-widest outline-none transition-all">
                      <option value="all">Todas Dificuldades</option>
                      {Object.keys(DIFFICULTIES).map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                {isExhausted ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-12 animate-in fade-in">
                    <div className="text-9xl animate-bounce drop-shadow-[0_0_60px_rgba(239,68,68,0.7)]">💀</div>
                    <div className="text-center space-y-4">
                      <h2 className="text-8xl font-rpg text-red-600 font-black uppercase tracking-tighter">EXAUSTO</h2>
                      <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-sm">Ressurgindo em {Math.ceil((exhaustionEndTime! - now) / 1000)}s</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {questSubTab === 'active' && (
                      <button onClick={()=>setShowQuestCreator(true)} className="w-full bg-zinc-900/30 border-4 border-dashed border-zinc-800 p-8 rounded-[3rem] flex items-center justify-center gap-6 hover:border-indigo-600/50 transition-all group active:scale-[0.98]">
                        <span className="text-3xl group-hover:scale-125 transition-transform">📜</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-indigo-400">Firmar Novo Contrato</span>
                      </button>
                    )}
                    {showQuestCreator && <QuestStepper onComplete={async data => { await updateAndSave({...user!, tasks: [{...data, durationMinutes: data.duration, id: Math.random().toString(36).substr(2,9), startTime: null, accumulatedTimeMs: 0, isPaused: false, done: false, createdAt: Date.now()}, ...(user?.tasks || [])]}); setShowQuestCreator(false); }} onCancel={()=>setShowQuestCreator(false)} />}
                    <div className="grid grid-cols-1 gap-8">
                      {filteredTasks.length === 0 ? (
                        <div className="py-32 text-center space-y-6 opacity-30">
                          <p className="text-6xl">🕯️</p>
                          <p className="text-xs font-black uppercase tracking-widest">Nenhum registro encontrado nestas terras...</p>
                        </div>
                      ) : (
                        filteredTasks.map(task => {
                          const isRunning = task.startTime !== null;
                          const targetMs = (task.durationMinutes || 5) * 60 * 1000;
                          const progress = Math.min(100, (task.accumulatedTimeMs / targetMs) * 100);
                          const remainingMs = Math.max(0, targetMs - task.accumulatedTimeMs);
                          const isReady = progress >= 100;
                          const rarityCfg = RARITIES[task.rarity] || RARITIES.comum;
                          const diffCfg = DIFFICULTIES[task.difficulty] || DIFFICULTIES.facil;
                          const classStats = CLASS_STATS[user!.charClass];

                          return (
                            <div key={task.id} className={`p-8 md:p-12 rounded-[3.5rem] border-2 shadow-2xl relative overflow-hidden flex flex-col gap-8 transition-all group ${rarityCfg.bg} ${rarityCfg.shadow} ${isRunning && !isReady ? 'ring-2 ring-white/10' : ''} ${task.done ? 'opacity-70' : 'hover:scale-[1.01]'} border-zinc-800`}>
                               {!isRunning && !task.done && (
                                 <div className="absolute top-6 right-8">
                                    <button onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }} className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-600 transition-all shadow-lg cursor-pointer">✕</button>
                                 </div>
                               )}
                               <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-4">
                                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${rarityCfg.color}`}>{task.rarity}</span>
                                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border border-zinc-800 text-zinc-500`}>{task.difficulty}</span>
                                     </div>
                                     <h3 className={`text-5xl font-rpg font-black tracking-tighter uppercase leading-tight ${task.failed ? 'text-red-900 line-through opacity-40' : 'text-white'}`}>{task.title}</h3>
                                     <div className="flex gap-6">
                                        <span className="text-amber-500 font-black text-sm flex items-center gap-2 bg-zinc-950/40 px-4 py-1.5 rounded-xl">💰 {Math.floor(rarityCfg.gold * diffCfg.multiplier * classStats.goldMod)}G</span>
                                        <span className="text-indigo-400 font-black text-sm flex items-center gap-2 bg-zinc-950/40 px-4 py-1.5 rounded-xl">✨ {Math.floor(rarityCfg.xp * diffCfg.multiplier * classStats.xpMod)}XP</span>
                                     </div>
                                  </div>
                                  {isRunning && !isReady && !task.done && (
                                    <div className={`text-right bg-zinc-950/60 p-6 rounded-3xl border border-white/5 transition-all ${task.isPaused ? 'opacity-40' : 'opacity-100'}`}>
                                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Tempo Restante</span>
                                       <span className="text-6xl font-black font-mono text-white tracking-tighter">{formatTime(remainingMs)}</span>
                                    </div>
                                  )}
                               </div>
                               <div className="flex justify-end gap-4 items-center pt-4 border-t border-white/5">
                                {!task.done && (
                                  <>
                                    {isRunning && !isReady && (
                                      <>
                                        <button onClick={() => handlePauseToggle(task.id)} className={`px-8 py-4 border rounded-2xl font-black uppercase text-[9px] ${task.isPaused ? 'bg-amber-600 text-white' : 'border-white/10 text-white/50'}`}>{task.isPaused ? 'Retomar' : 'Pausar'}</button>
                                        <button onClick={()=>setTaskToAbandon(task.id)} className="px-8 py-4 border border-red-900/40 text-red-600/60 font-black uppercase text-[9px] rounded-2xl">Abandonar</button>
                                      </>
                                    )}
                                    {!isRunning ? (
                                      <button onClick={async ()=>await updateAndSave({...user!, tasks: user!.tasks.map(t=>t.id===task.id?{...t, startTime:Date.now(), lastTickTime: Date.now()}:t)})} className="px-12 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] hover:scale-105 transition-all shadow-xl">Iniciar Missão</button>
                                    ) : isReady ? (
                                      <button onClick={()=>handleQuestComplete(task.id, task.rarity, task.difficulty)} className="px-14 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest animate-pulse shadow-2xl">Reivindicar Tesouros</button>
                                    ) : (
                                      <div className={`px-12 py-5 bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 rounded-[2rem] font-black uppercase text-[9px] tracking-widest italic ${task.isPaused ? 'opacity-40' : 'animate-pulse'}`}>{task.isPaused ? 'Foco Interrompido' : 'Caminhando na Jornada...'}</div>
                                    )}
                                  </>
                                )}
                                {task.done && (
                                   <button onClick={() => setTaskToDelete(task.id)} className="px-8 py-4 bg-zinc-800/20 text-zinc-500 rounded-2xl font-black uppercase text-[9px] hover:text-red-500 transition-all border border-white/5">Expurgar Registro</button>
                                )}
                             </div>
                             {isRunning && !task.done && (
                               <div className="w-full h-3 bg-zinc-950/80 rounded-full border border-white/5 overflow-hidden mt-2">
                                  <div className={`h-full transition-all duration-1000 ${task.isPaused ? 'bg-zinc-700' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                               </div>
                             )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
             </div>
          )}

          {activeTab === 'social' && <SocialTab user={user!} onUpdate={(u) => setUser(u)} />}
          {activeTab === 'campaign' && <CampaignTab user={user!} onClaim={async (id) => { const mission = CAMPAIGN_CHAPTERS.find(m => m.id === id); if (mission) await updateAndSave({...user!, xp: user!.xp + mission.xpReward, gold: user!.gold + mission.goldReward, campaignProgress: user!.campaignProgress + 1}); }} />}
          {activeTab === 'shop' && <Shop user={user!} onPurchase={handlePurchase} />}
          {activeTab === 'inventory' && <div className="pb-32 text-center text-zinc-700 uppercase font-black text-xs tracking-widest py-40">Mochila em manutenção...</div>}
          {activeTab === 'skills' && <SkillsManager user={user!} onUpgrade={async (id) => { const skill = user!.skills?.find(s => s.id === id); if (!skill) return; const cost = Math.floor(skill.xpCostBase * Math.pow(1.5, skill.level)); if (user!.xp >= cost) await updateAndSave({ ...user!, xp: user!.xp - cost, skills: user!.skills.map(s => s.id === id ? { ...s, level: s.level + 1 } : s) }); }} onEquip={async (id) => { await updateAndSave({ ...user!, equippedSkills: user!.equippedSkills?.includes(id) ? user!.equippedSkills.filter(s => s !== id) : [...(user!.equippedSkills || []), id] }); }} onUseActive={async (id) => { if (id === 'meditation') await updateAndSave({ ...user!, hp: Math.min(user!.maxHp, user!.hp + 15) }); }} />}
          
          {activeTab === 'settings' && (
            <SettingsTab user={user!} onEditProfile={() => setIsEditingProfile(true)} onLogout={() => { db.logout(); window.location.reload(); }} onResetData={() => { localStorage.clear(); window.location.reload(); }} onCheat={handleCheat} animationsEnabled={animationsEnabled} setAnimationsEnabled={setAnimationsEnabled} />
          )}

          {taskToDelete && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
               <div className="max-w-md w-full bg-zinc-900 border-2 border-red-600/50 rounded-[4rem] p-16 text-center shadow-3xl">
                  <div className="text-7xl mb-8">🗑️</div>
                  <h3 className="text-4xl font-rpg text-white font-black uppercase mb-4 tracking-tighter">Apagar Lenda?</h3>
                  <div className="flex flex-col gap-4">
                     <button onClick={() => confirmDeleteTask(taskToDelete)} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase hover:bg-red-500 transition-all shadow-xl active:scale-95 border-b-4 border-red-800">Sim, Expurgar</button>
                     <button onClick={() => setTaskToDelete(null)} className="w-full py-6 bg-zinc-800 text-zinc-400 rounded-[2rem] font-black uppercase hover:text-white transition-all active:scale-95">Manter Registro</button>
                  </div>
               </div>
            </div>
          )}

          {taskToAbandon && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
               <div className="max-w-md w-full bg-zinc-900 border-2 border-red-600/50 rounded-[4rem] p-16 text-center shadow-3xl">
                  <div className="text-7xl mb-8">🩸</div>
                  <h3 className="text-4xl font-rpg text-red-600 font-black uppercase mb-4 tracking-tighter">Abandonar?</h3>
                  <p className="text-red-500 text-6xl font-black mb-12">-{RARITIES[user?.tasks?.find(t=>t.id===taskToAbandon)?.rarity || 'comum']?.hpCost || 5} HP</p>
                  <div className="flex flex-col gap-4">
                     <button onClick={async ()=>await handleCancelTask(taskToAbandon)} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase hover:bg-red-500 shadow-xl active:scale-95 border-b-4 border-red-800">Aceitar Derrota</button>
                     <button onClick={()=>setTaskToAbandon(null)} className="w-full py-6 bg-zinc-800 text-zinc-400 rounded-[2rem] font-black uppercase hover:text-white active:scale-95">Continuar Jornada</button>
                  </div>
               </div>
            </div>
          )}

          {selectedInventoryItem && (
            <ItemDetailsModal item={selectedInventoryItem} user={user!} onClose={() => setSelectedInventoryItem(null)} onAction={handleEquipItem} actionLabel={user?.equipment && Object.values(user.equipment).includes(selectedInventoryItem.id) ? 'Remover' : 'Equipar'} />
          )}
        </main>
      </div>
    </ClickSpark>
  );
};

export default App;
