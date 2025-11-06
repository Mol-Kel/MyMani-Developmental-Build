import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { transactionStorage } from '@/lib/storage';

const STREAK_KEY = 'mymani_streak';

interface StreakData {
  currentStreak: number;
  lastActivityDate: string;
  bestStreak: number;
}

export const useStreak = () => {
  const [streak, setStreak] = useState<StreakData>(() => {
    const saved = storage.get<StreakData>(STREAK_KEY);
    return saved || { currentStreak: 0, lastActivityDate: '', bestStreak: 0 };
  });

  useEffect(() => {
    updateStreak();
  }, []);

  const updateStreak = () => {
    const transactions = transactionStorage.getAll();
    if (transactions.length === 0) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const saved = storage.get<StreakData>(STREAK_KEY) || {
      currentStreak: 0,
      lastActivityDate: '',
      bestStreak: 0,
    };

    // Check if there's a transaction today
    const hasTransactionToday = transactions.some((t) => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.toISOString().split('T')[0] === todayStr;
    });

    if (!hasTransactionToday) {
      setStreak(saved);
      return;
    }

    const lastDate = saved.lastActivityDate ? new Date(saved.lastActivityDate) : null;
    
    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const lastDateStr = lastDate.toISOString().split('T')[0];
      
      if (lastDateStr === todayStr) {
        // Already counted today
        setStreak(saved);
        return;
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDateStr === yesterdayStr) {
        // Continue streak
        const newStreak = saved.currentStreak + 1;
        const newBest = Math.max(newStreak, saved.bestStreak);
        const newData = {
          currentStreak: newStreak,
          lastActivityDate: todayStr,
          bestStreak: newBest,
        };
        storage.set(STREAK_KEY, newData);
        setStreak(newData);
      } else {
        // Streak broken, start new
        const newData = {
          currentStreak: 1,
          lastActivityDate: todayStr,
          bestStreak: saved.bestStreak,
        };
        storage.set(STREAK_KEY, newData);
        setStreak(newData);
      }
    } else {
      // First time
      const newData = {
        currentStreak: 1,
        lastActivityDate: todayStr,
        bestStreak: 1,
      };
      storage.set(STREAK_KEY, newData);
      setStreak(newData);
    }
  };

  return streak;
};
