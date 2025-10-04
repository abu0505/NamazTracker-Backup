import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PrayerType, PrayerStatus } from '@shared/schema';
import { calculateWeekProgress, calculateWeekProgressFromAPI, getTodayString, checkAchievements, getTodayCompletedCount, getWeekDates, calculateCurrentStreakFromAPI, calculateQazaCountFromAPI, calculateRealTimeStatistics, updateUserStatisticsInBackend } from '@/lib/prayer-utils';
import { useToast } from '@/hooks/use-toast';
import { apiService, convertPrayerRecordToDailyPrayers } from '@/lib/api-service';

export interface DailyPrayers {
  fajr: PrayerStatus;
  dhuhr: PrayerStatus;
  asr: PrayerStatus;
  maghrib: PrayerStatus;
  isha: PrayerStatus;
}

export interface PrayerContextType {
  todayPrayers: DailyPrayers;
  weekProgress: number;
  currentStreak: number;
  qazaCount: number;
  togglePrayer: (prayer: PrayerType) => void;
  isLoading: boolean;
  refreshStatistics: () => Promise<void>;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

const defaultPrayers: DailyPrayers = {
  fajr: { completed: false, onTime: false },
  dhuhr: { completed: false, onTime: false },
  asr: { completed: false, onTime: false },
  maghrib: { completed: false, onTime: false },
  isha: { completed: false, onTime: false },
};

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const [todayPrayers, setTodayPrayers] = useState<DailyPrayers>(defaultPrayers);
  const [weekProgress, setWeekProgress] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [qazaCount, setQazaCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      await loadTodayPrayers();
      await loadUserStats();
      try {
        // Ensure we have the latest week progress from API
        const progress = await calculateWeekProgressFromAPI();
        setWeekProgress(progress);
      } catch (error) {
        console.warn('Failed to get initial week progress from API:', error);
      }
    };
    initializeApp();
  }, []);

  const loadTodayPrayers = async () => {
    try {
      const today = getTodayString();
      
      // Try to load from API first
      const apiRecord = await apiService.getPrayerRecord(today);
      if (apiRecord) {
        const apiPrayers = convertPrayerRecordToDailyPrayers(apiRecord);
        if (apiPrayers) {
          setTodayPrayers(apiPrayers);
          // Also save to localStorage for fallback
          localStorage.setItem(`prayers-${today}`, JSON.stringify(apiPrayers));
          
          // Try to get week progress from API first
          try {
            const progress = await calculateWeekProgressFromAPI();
            setWeekProgress(progress);
          } catch (error) {
            console.warn('Failed to get week progress from API, falling back to localStorage:', error);
            const progress = calculateWeekProgress();
            setWeekProgress(progress);
          }
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to localStorage if API fails or returns null
      const stored = localStorage.getItem(`prayers-${today}`);
      if (stored) {
        const prayers = JSON.parse(stored);
        setTodayPrayers(prayers);
        // Try to sync to backend if we have localStorage data but no API data
        try {
          await apiService.savePrayerRecord(today, prayers);
        } catch (error) {
          console.warn('Failed to sync localStorage data to API:', error);
        }
      }
      
      // Try to get week progress from API first
      try {
        const progress = await calculateWeekProgressFromAPI();
        setWeekProgress(progress);
      } catch (error) {
        console.warn('Failed to get week progress from API, falling back to localStorage:', error);
        const progress = calculateWeekProgress();
        setWeekProgress(progress);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load prayers:', error);
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Try to load from API first
      const apiStats = await apiService.getUserStats();
      if (apiStats) {
        setCurrentStreak(apiStats.currentStreak || 0);
        setQazaCount(apiStats.qazaPrayers || 0);
        // Save to localStorage for fallback
        localStorage.setItem('currentStreak', (apiStats.currentStreak || 0).toString());
        localStorage.setItem('qazaCount', (apiStats.qazaPrayers || 0).toString());
        return;
      }
      
      // If no API stats, calculate from scratch
      try {
        const calculatedStreak = await calculateCurrentStreakFromAPI();
        const calculatedQaza = await calculateQazaCountFromAPI();
        
        setCurrentStreak(calculatedStreak);
        setQazaCount(calculatedQaza);
        
        // Save calculated values to localStorage
        localStorage.setItem('currentStreak', calculatedStreak.toString());
        localStorage.setItem('qazaCount', calculatedQaza.toString());
        
        // Update backend with calculated values
        await updateUserStatisticsInBackend({ fajr: { completed: false, onTime: false }, dhuhr: { completed: false, onTime: false }, asr: { completed: false, onTime: false }, maghrib: { completed: false, onTime: false }, isha: { completed: false, onTime: false } });
      } catch (error) {
        console.warn('Failed to calculate statistics from API, falling back to localStorage:', error);
        
        // Final fallback to localStorage
        const streak = localStorage.getItem('currentStreak');
        const qaza = localStorage.getItem('qazaCount');
        
        setCurrentStreak(streak ? parseInt(streak) : 0);
        setQazaCount(qaza ? parseInt(qaza) : 0);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
      // Fallback to localStorage on error
      const streak = localStorage.getItem('currentStreak');
      const qaza = localStorage.getItem('qazaCount');
      
      setCurrentStreak(streak ? parseInt(streak) : 0);
      setQazaCount(qaza ? parseInt(qaza) : 0);
    }
  };

  const saveTodayPrayers = async (prayers: DailyPrayers) => {
    try {
      const today = getTodayString();
      
      // Calculate real-time statistics for immediate UI updates
      const currentStats = { currentStreak, qazaCount };
      const realTimeStats = calculateRealTimeStatistics(prayers, currentStats);
      
      // Update UI immediately with calculated values
      setCurrentStreak(realTimeStats.currentStreak);
      setQazaCount(realTimeStats.qazaCount);
      
      // Save to localStorage immediately for fast UI updates
      localStorage.setItem(`prayers-${today}`, JSON.stringify(prayers));
      
      // Try to save to API
      try {
        await apiService.savePrayerRecord(today, prayers);
      } catch (error) {
        console.warn('Failed to save prayers to API, saved to localStorage only:', error);
      }
      
      // Update week progress using backend data for better consistency
      let progress: number;
      try {
        progress = await calculateWeekProgressFromAPI();
        setWeekProgress(progress);
      } catch (error) {
        console.warn('Failed to get week progress from API, falling back to localStorage:', error);
        progress = calculateWeekProgress();
        setWeekProgress(progress);
      }
      
      // Fetch updated statistics from backend for accuracy (server handles stats update in POST /api/prayers)
      try {
        const updatedStats = await apiService.getUserStats();
        if (updatedStats) {
          setCurrentStreak(updatedStats.currentStreak || 0);
          setQazaCount(updatedStats.qazaPrayers || 0);
          
          // Update localStorage cache
          localStorage.setItem('currentStreak', (updatedStats.currentStreak || 0).toString());
          localStorage.setItem('qazaCount', (updatedStats.qazaPrayers || 0).toString());
        }
      } catch (error) {
        console.warn('Failed to fetch updated statistics:', error);
      }
      
      // Invalidate React Query cache for real-time sync - be more specific
      // Only invalidate today's prayer record query to avoid refreshing entire calendar
      const todayDate = getTodayString();
      queryClient.invalidateQueries({ queryKey: ['prayer-record', todayDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/yearly-qaza'] });

      // Invalidate analytics queries for all periods to ensure real-time sync
      ['week', 'month', 'year'].forEach(period => {
        queryClient.invalidateQueries({ queryKey: ['/analytics/trend', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/data', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/summary', period] });
      });

      // Check for achievements (prevent duplicates using localStorage)
      const completedCount = getTodayCompletedCount(prayers);

      try {
        // Load user stats for achievement calculations
        const userStats = await apiService.getUserStats();
        const achievements = await checkAchievements(prayers, progress, realTimeStats.currentStreak, userStats);

        achievements.forEach(async (achievement: { type: string; title: string; description: string; metadata?: any }) => {
        // Use different dedup keys: per day for Perfect Day, per week for Perfect Week
        let achievementKey: string;
        let shouldShow = false;

        if (achievement.type === "perfect_day" && completedCount === 5) {
          achievementKey = `${achievement.title}-${todayDate}`;
          shouldShow = !localStorage.getItem(achievementKey);
        } else if (achievement.type === "perfect_week") {
          // Use week start date for Perfect Week deduplication
          const weekDates = getWeekDates();
          const weekStart = weekDates[0]; // Monday of current week
          achievementKey = `${achievement.title}-${weekStart}`;
          shouldShow = !localStorage.getItem(achievementKey);
        } else if (achievement.type === "streak_milestone") {
          // For streak milestones, use streak days for deduplication
          achievementKey = `${achievement.type}-${achievement.metadata?.streakDays}`;
          shouldShow = !localStorage.getItem(achievementKey);
        } else if (achievement.type === "prayer_milestone") {
          // For prayer milestones, use total prayer count for deduplication
          achievementKey = `${achievement.type}-${achievement.metadata?.totalPrayers}`;
          shouldShow = !localStorage.getItem(achievementKey);
        } else if (achievement.type === "consistency") {
          // For consistency achievements, use period and date
          achievementKey = `${achievement.type}-${achievement.metadata?.period}-${achievement.metadata?.earnedDate}`;
          shouldShow = !localStorage.getItem(achievementKey);
        } else {
          // Generic deduplication for other types
          achievementKey = `${achievement.type}-${todayDate}`;
          shouldShow = !localStorage.getItem(achievementKey);
        }
        
        if (shouldShow && achievementKey!) {
          localStorage.setItem(achievementKey, 'true');
          
          // Try to save achievement to API
          try {
            await apiService.createAchievement({
              type: achievement.type,
              title: achievement.title,
              description: achievement.description,
              earnedDate: today,
              metadata: achievement.metadata || {
                onTimePrayers: completedCount,
                year: new Date().getFullYear(),
              },
            });
          } catch (error) {
            console.warn('Failed to save achievement to API:', error);
          }
          
          toast({
            title: "Achievement Unlocked! 🏆",
            description: achievement.description,
            duration: 5000,
          });
        }
      });
      } catch (error) {
        console.error('Failed to check achievements:', error);
      }
    } catch (error) {
      console.error('Failed to save prayers:', error);
    }
  };

  const togglePrayer = (prayer: PrayerType) => {
    const currentTime = new Date().toISOString();
    const wasCompleted = todayPrayers[prayer].completed;
    const newPrayers = {
      ...todayPrayers,
      [prayer]: {
        completed: !wasCompleted,
        onTime: !wasCompleted, // Assume on-time if completed now
        completedAt: !wasCompleted ? currentTime : undefined,
      }
    };
    
    setTodayPrayers(newPrayers);
    
    // Calculate immediate statistics impact
    const currentStats = { currentStreak, qazaCount };
    const realTimeStats = calculateRealTimeStatistics(newPrayers, currentStats);
    
    // Update statistics immediately for responsive UI
    setCurrentStreak(realTimeStats.currentStreak);
    setQazaCount(realTimeStats.qazaCount);
    
    // Save prayers and update comprehensive statistics
    saveTodayPrayers(newPrayers);
    
    // Show appropriate toast
    if (newPrayers[prayer].completed) {
      toast({
        title: "Prayer Completed! ✅",
        description: `${prayer.charAt(0).toUpperCase() + prayer.slice(1)} prayer marked as completed`,
        duration: 2000,
      });
    } else {
      toast({
        title: "Prayer Unmarked ❌",
        description: `${prayer.charAt(0).toUpperCase() + prayer.slice(1)} prayer unmarked`,
        duration: 2000,
      });
    }
  };

  // Function to refresh statistics from backend
  const refreshStatistics = async () => {
    try {
      // Invalidate React Query cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/yearly-qaza'] });
      
      // Invalidate analytics queries for all periods
      ['week', 'month', 'year'].forEach(period => {
        queryClient.invalidateQueries({ queryKey: ['/analytics/trend', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/data', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/summary', period] });
      });
      
      // Refresh user statistics from API
      const apiStats = await apiService.getUserStats();
      if (apiStats) {
        setCurrentStreak(apiStats.currentStreak || 0);
        setQazaCount(apiStats.qazaPrayers || 0);
        
        // Update localStorage cache
        localStorage.setItem('currentStreak', (apiStats.currentStreak || 0).toString());
        localStorage.setItem('qazaCount', (apiStats.qazaPrayers || 0).toString());
      }
      
      // Refresh week progress
      const progress = await calculateWeekProgressFromAPI();
      setWeekProgress(progress);
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    }
  };

  return (
    <PrayerContext.Provider
      value={{
        todayPrayers,
        weekProgress,
        currentStreak,
        qazaCount,
        togglePrayer,
        isLoading,
        refreshStatistics,
      }}
    >
      {children}
    </PrayerContext.Provider>
  );
}

export function usePrayer() {
  const context = useContext(PrayerContext);
  if (context === undefined) {
    throw new Error('usePrayer must be used within a PrayerProvider');
  }
  return context;
}
