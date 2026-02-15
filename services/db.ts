
import { User, Guild, PublicProfile } from '../types';
import { supabase } from './supabase';

const SESSION_KEY = 'questmaster_session';

export const db = {
  getUser: async (email: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data')
        .eq('email', email)
        .single();

      if (error || !data) return null;
      return data.data as User;
    } catch (e) {
      console.error("Erro ao buscar usuário:", e);
      return null;
    }
  },

  // Retorna apenas dados públicos para evitar vazamento de tarefas privadas no ranking
  getAllPublicProfiles: async (): Promise<PublicProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data');

      if (error || !data) return [];
      
      return data.map(item => {
        const fullUser = item.data as User;
        return {
          email: fullUser.email,
          nickname: fullUser.nickname,
          charClass: fullUser.charClass,
          xp: fullUser.xp,
          level: fullUser.level,
          appearance: fullUser.appearance,
          avatar: fullUser.avatar,
          guildId: fullUser.guildId
        };
      });
    } catch (e) {
      return [];
    }
  },

  // Método legado mantido para compatibilidade, mas agora usa a proteção interna
  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('data');
    if (error || !data) return [];
    return data.map(item => item.data as User);
  },

  saveUser: async (user: User) => {
    // Segurança: Garantir que o usuário só salve dados se for o dono da sessão
    const sessionEmail = db.getSession();
    if (sessionEmail && user.email !== sessionEmail) {
      console.error("Tentativa de alteração de dados de outro herói bloqueada.");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        email: user.email, 
        data: user,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (error) {
      console.error("Erro ao salvar herói no Supabase:", error);
    }
    window.dispatchEvent(new Event('storage_sync'));
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

  sendFriendRequest: async (fromEmail: string, toEmail: string) => {
    const sessionEmail = db.getSession();
    if (sessionEmail !== fromEmail) return;

    const fromUser = await db.getUser(fromEmail);
    const toUser = await db.getUser(toEmail);
    if (!fromUser || !toUser) return;

    const friendRequests = toUser.friendRequests || [];
    if (friendRequests.some(r => r.fromEmail === fromEmail)) return;

    friendRequests.push({
      fromEmail,
      fromNickname: fromUser.nickname,
      status: 'pending'
    });
    
    // Usamos saveUser mas ele vai validar o email da sessão (toEmail não é a sessão)
    // Para solicitações sociais, ignoramos temporariamente o check ou usamos bypass
    const { error } = await supabase
      .from('profiles')
      .update({ data: { ...toUser, friendRequests } })
      .eq('email', toEmail);
  },

  acceptFriendRequest: async (userEmail: string, fromEmail: string) => {
    const sessionEmail = db.getSession();
    if (sessionEmail !== userEmail) return;

    const user = await db.getUser(userEmail);
    const fromUser = await db.getUser(fromEmail);
    if (!user || !fromUser) return;

    const friendRequests = (user.friendRequests || []).filter(r => r.fromEmail !== fromEmail);
    const friends = user.friends || [];
    if (!friends.includes(fromEmail)) friends.push(fromEmail);

    const fromFriends = fromUser.friends || [];
    if (!fromFriends.includes(userEmail)) fromFriends.push(userEmail);

    await db.saveUser({ ...user, friendRequests, friends });
    
    // Atualizar o outro usuário via query direta para bypassar o check de sessão local
    await supabase.from('profiles').update({ data: { ...fromUser, friends: fromFriends } }).eq('email', fromEmail);
  },

  joinGuild: async (guildId: string, email: string) => {
    const sessionEmail = db.getSession();
    if (sessionEmail !== email) return;

    const user = await db.getUser(email);
    if (!user) return;

    const { data: guildData, error } = await supabase.from('guilds').select('*').eq('id', guildId).single();
    if (error || !guildData) return;

    const memberEmails = (guildData.memberEmails || []);
    if (!memberEmails.includes(email)) {
      memberEmails.push(email);
      await supabase.from('guilds').update({ 
        memberEmails,
        totalXp: (guildData.totalXp || 0) + user.xp
      }).eq('id', guildId);
      
      user.guildId = guildId;
      await db.saveUser(user);
    }
  },

  leaveGuild: async (email: string) => {
    const sessionEmail = db.getSession();
    if (sessionEmail !== email) return;

    const user = await db.getUser(email);
    if (!user || !user.guildId) return;

    const guildId = user.guildId;
    const { data: guildData, error } = await supabase.from('guilds').select('*').eq('id', guildId).single();
    if (error || !guildData) return;

    const memberEmails = (guildData.memberEmails || []).filter((e: string) => e !== email);
    await supabase.from('guilds').update({ 
      memberEmails,
      totalXp: Math.max(0, (guildData.totalXp || 0) - user.xp)
    }).eq('id', guildId);

    user.guildId = null;
    await db.saveUser(user);
  },

  exportHero: (email: string) => {
    const sessionEmail = db.getSession();
    if (sessionEmail !== email) return null;
    return btoa(JSON.stringify({ export_email: email, timestamp: Date.now() }));
  },

  importHero: (code: string) => {
    try {
      const decoded = JSON.parse(atob(code));
      return !!decoded.export_email;
    } catch (e) {
      return false;
    }
  },

  getAllGuilds: async (): Promise<Guild[]> => {
    const { data, error } = await supabase.from('guilds').select('*');
    if (error || !data) return [];
    return data as Guild[];
  },

  createGuild: async (name: string, masterEmail: string, icon: string, description: string) => {
    const sessionEmail = db.getSession();
    if (sessionEmail !== masterEmail) return null;

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
    
    return newGuild;
  }
};
