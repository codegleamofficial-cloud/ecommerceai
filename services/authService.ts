import { User } from '../types';

const STORAGE_KEY_USERS = 'ecomlens_users_v1';
const STORAGE_KEY_CURRENT = 'ecomlens_current_user_v1';

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0];

export const AuthService = {
  initialize: () => {
    const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
    if (!usersStr) {
      // Seed admin user if no database exists
      const admin: User = {
        id: 'admin-1',
        email: 'admin@admin.com',
        role: 'admin',
        creditsUsed: 0,
        maxCredits: 1000,
        lastResetDate: getTodayString()
      };
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([admin]));
    }
  },

  login: (email: string): User | null => {
    AuthService.initialize();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // Check for daily reset
      const today = getTodayString();
      if (user.lastResetDate !== today) {
        user.creditsUsed = 0;
        user.lastResetDate = today;
        AuthService.saveUser(user);
      }
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(user));
      return user;
    }
    return null;
  },

  signup: (email: string): User | null => {
    AuthService.initialize();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    if (users.find((u: User) => u.email.toLowerCase() === email.toLowerCase())) {
      return null; // User exists
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      role: 'user',
      creditsUsed: 0,
      maxCredits: 5, // Default limit
      lastResetDate: getTodayString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_CURRENT);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!stored) return null;
    const user = JSON.parse(stored);
    
    // Refresh check
    const today = getTodayString();
    if (user.lastResetDate !== today) {
        user.creditsUsed = 0;
        user.lastResetDate = today;
        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(user));
        AuthService.saveUser(user);
    }
    return user;
  },

  checkLimit: (user: User): boolean => {
    return user.creditsUsed < user.maxCredits;
  },

  incrementUsage: (userId: string) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    if (index !== -1) {
      users[index].creditsUsed += 1;
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      
      // Update session
      const current = AuthService.getCurrentUser();
      if (current && current.id === userId) {
        current.creditsUsed = users[index].creditsUsed;
        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(current));
      }
    }
  },

  // Admin functions
  getAllUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
  },

  updateUserLimit: (userId: string, newLimit: number) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    if (index !== -1) {
      users[index].maxCredits = newLimit;
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
  },

  saveUser: (user: User) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const index = users.findIndex((u: User) => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
  }
};
