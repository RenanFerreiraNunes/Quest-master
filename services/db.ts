
import { User } from '../types';

const USERS_KEY = 'questmaster_users';
const SESSION_KEY = 'questmaster_session';

export const db = {
  getUser: (email: string): User | null => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    return users[email] || null;
  },

  saveUser: (user: User) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    users[user.email] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  setSession: (email: string) => {
    localStorage.setItem(SESSION_KEY, email);
  },

  getSession: (): string | null => {
    return localStorage.getItem(SESSION_KEY);
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
