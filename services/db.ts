
import { User, Guild, FriendRequest } from '../types';
import { supabase } from './supabase';

const SESSION_KEY = 'questmaster_session';

export const db = {
  getUser: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return data.data as User;
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('data');

    if (error || !data) return [];
    return data.map(d => d.data as User);
  },

  saveUser: async (user: User) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        email: user.email, 
        nickname: user.nickname,
        xp: user.xp,
        level: user.level,
        data: user 
      }, { onConflict: 'email' });

    if (error) console.error("Erro ao salvar no Supabase:", error);
  },

  setSession: (email: string) => {
    localStorage.setItem(SESSION_KEY, email);
  },

  getSession: (): string | null => {
    return localStorage.getItem(SESSION_KEY);
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Sistema de Amizade Online
  sendFriendRequest: async (fromEmail: string, toEmail: string) => {
    const toUser = await db.getUser(toEmail);
    const fromUser = await db.getUser(fromEmail);
    if (!toUser || !fromUser || fromEmail === toEmail) return;

    if (toUser.friendRequests?.some(r => r.fromEmail === fromEmail)) return;
    if (toUser.friends?.includes(fromEmail)) return;

    const updatedToUser = { ...toUser };
    updatedToUser.friendRequests = updatedToUser.friendRequests || [];
    updatedToUser.friendRequests.push({
      fromEmail: fromUser.email,
      fromNickname: fromUser.nickname,
      status: 'pending'
    });
    
    await db.saveUser(updatedToUser);
  },

  acceptFriendRequest: async (userEmail: string, fromEmail: string) => {
    const user = await db.getUser(userEmail);
    const fromUser = await db.getUser(fromEmail);
    if (!user || !fromUser) return;

    user.friendRequests = (user.friendRequests || []).filter(r => r.fromEmail !== fromEmail);
    user.friends = user.friends || [];
    if (!user.friends.includes(fromEmail)) user.friends.push(fromEmail);

    fromUser.friends = fromUser.friends || [];
    if (!fromUser.friends.includes(userEmail)) fromUser.friends.push(userEmail);
    
    await db.saveUser(user);
    await db.saveUser(fromUser);
  },

  // Guildas Online
  getAllGuilds: async (): Promise<Guild[]> => {
    const { data, error } = await supabase
      .from('guilds')
      .select('*');
    if (error || !data) return [];
    return data as Guild[];
  },

  createGuild: async (name: string, masterEmail: string, icon: string, description: string) => {
    const user = await db.getUser(masterEmail);
    if (!user || user.gold < 500) return null;

    const newGuild = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      icon,
      masterEmail,
      memberEmails: [masterEmail],
      totalXp: user.xp,
      description,
      requiredLevel: 1
    };

    const { error } = await supabase.from('guilds').insert(newGuild);
    if (error) return null;

    user.gold -= 500;
    user.guildId = newGuild.id;
    await db.saveUser(user);
    
    return newGuild as Guild;
  },

  joinGuild: async (guildId: string, userEmail: string) => {
    const user = await db.getUser(userEmail);
    if (!user || user.guildId) return;

    const { data: guild, error: gError } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', guildId)
      .single();

    if (gError || !guild) return;

    const updatedMembers = [...guild.memberEmails, userEmail];
    const updatedXp = guild.totalXp + user.xp;

    await supabase.from('guilds').update({ 
      memberEmails: updatedMembers,
      totalXp: updatedXp 
    }).eq('id', guildId);

    user.guildId = guildId;
    await db.saveUser(user);
  },

  leaveGuild: async (userEmail: string) => {
    const user = await db.getUser(userEmail);
    if (!user || !user.guildId) return;

    const { data: guild, error } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', user.guildId)
      .single();

    if (error || !guild) return;

    let updatedMembers = guild.memberEmails.filter((e: string) => e !== userEmail);
    let updatedMaster = guild.masterEmail;

    if (updatedMaster === userEmail) {
      updatedMaster = updatedMembers.length > 0 ? updatedMembers[0] : null;
    }

    if (updatedMembers.length === 0) {
      await supabase.from('guilds').delete().eq('id', user.guildId);
    } else {
      await supabase.from('guilds').update({ 
        memberEmails: updatedMembers,
        masterEmail: updatedMaster,
        totalXp: Math.max(0, guild.totalXp - user.xp)
      }).eq('id', user.guildId);
    }

    user.guildId = null;
    await db.saveUser(user);
  },

  addGuildXp: async (guildId: string, amount: number) => {
    const { data: guild } = await supabase.from('guilds').select('totalXp').eq('id', guildId).single();
    if (guild) {
      await supabase.from('guilds').update({ totalXp: guild.totalXp + amount }).eq('id', guildId);
    }
  },

  // Fix: Added exportHero to allow copying user character data synchronously
  exportHero: (user: User): string => {
    try {
      return btoa(encodeURIComponent(JSON.stringify(user)));
    } catch (e) {
      console.error("Export failed:", e);
      return "";
    }
  },

  // Fix: Added importHero to allow bringing character data into the realm asynchronously
  importHero: async (code: string): Promise<boolean> => {
    try {
      const decoded = decodeURIComponent(atob(code));
      const user = JSON.parse(decoded) as User;
      if (user && user.email && user.nickname) {
        await db.saveUser(user);
        return true;
      }
    } catch (e) {
      console.error("Import failed:", e);
    }
    return false;
  }
};
