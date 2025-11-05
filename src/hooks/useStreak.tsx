import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

interface StreakData {
  currentStreak: number;
  lastVisit: string;
}

const STORAGE_KEY = 'mymani_streak';

export const useStreak = () => {
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const streakData = storage.get<StreakData>(STORAGE_KEY);
    
    if (!streakData) {
      // First visit ever
      const newData: StreakData = {
        currentStreak: 1,
        lastVisit: today,
      };
      storage.set(STORAGE_KEY, newData);
      setStreak(1);
      return;
    }

    const lastVisit = streakData.lastVisit;
    
    if (lastVisit === today) {
      // Already visited today
      setStreak(streakData.currentStreak);
      return;
    }

    const lastVisitDate = new Date(lastVisit);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastVisitDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newStreak: number;
    
    if (diffDays === 1) {
      // Consecutive day visit
      newStreak = streakData.currentStreak + 1;
    } else if (diffDays > 1) {
      // Streak broken, restart
      newStreak = 1;
    } else {
      // Same day or future (shouldn't happen)
      newStreak = streakData.currentStreak;
    }

    const newData: StreakData = {
      currentStreak: newStreak,
      lastVisit: today,
    };
    storage.set(STORAGE_KEY, newData);
    setStreak(newStreak);
  }, []);

  return streak;
};
