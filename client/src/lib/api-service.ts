import { apiRequest } from './queryClient';
import { PrayerRecord, Achievement, UserStats } from '@shared/schema';
import { DailyPrayers } from '../contexts/prayer-context';
import { handleAuthError } from './authUtils';

export interface PrayerApiService {
  // Prayer records
  getPrayerRecord(date: string): Promise<PrayerRecord | null>;
  savePrayerRecord(date: string, prayers: DailyPrayers): Promise<PrayerRecord>;
  getPrayerRecords(startDate?: string, endDate?: string): Promise<PrayerRecord[]>;
  batchUpdatePrayerRecords(updates: Array<{ date: string; prayers: DailyPrayers }>): Promise<PrayerRecord[]>;

  // User statistics  
  getUserStats(): Promise<UserStats>;
  updateUserStats(updates: Partial<UserStats>): Promise<UserStats>;
  getYearlyQazaStats(): Promise<{ totalPossible: number; completed: number; qazaRemaining: number; currentYear: number }>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: Omit<Achievement, 'id' | 'userId' | 'createdAt'>): Promise<Achievement>;
}

// Helper function to safely parse JSON from response
function safeJsonParse(response: Response): Promise<any> {
  // Check if response has content before parsing JSON
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 304 || response.status === 204) {
    return Promise.resolve(null);
  }
  return response.json();
}

class ApiService implements PrayerApiService {
  async getPrayerRecord(date: string): Promise<PrayerRecord | null> {
    try {
      const response = await fetch(`/api/prayers/${date}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        const errorMessage = `Failed to fetch prayer record: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      return await safeJsonParse(response);
    } catch (error: any) {
      console.error('Error fetching prayer record:', error);
      
      // Handle auth errors
      if (handleAuthError(error)) {
        throw error; // Re-throw for proper error handling upstream
      }
      
      return null;
    }
  }

  async savePrayerRecord(date: string, prayers: DailyPrayers): Promise<PrayerRecord> {
    const response = await apiRequest('POST', '/api/prayers', {
      date,
      prayers,
    });
    
    return await safeJsonParse(response);
  }

  async getPrayerRecords(startDate?: string, endDate?: string): Promise<PrayerRecord[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/api/prayers${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorMessage = `Failed to fetch prayer records: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const result = await safeJsonParse(response);
      return result || [];
    } catch (error: any) {
      console.error('Error fetching prayer records:', error);
      
      // Handle auth errors
      if (handleAuthError(error)) {
        throw error; // Re-throw for proper error handling upstream
      }
      
      return [];
    }
  }

  async batchUpdatePrayerRecords(updates: Array<{ date: string; prayers: DailyPrayers }>): Promise<PrayerRecord[]> {
    try {
      const response = await apiRequest('POST', '/api/prayers/batch', { updates });
      return await safeJsonParse(response);
    } catch (error: any) {
      console.error('Error in batch update prayer records:', error);
      
      // Handle auth errors
      if (handleAuthError(error)) {
        throw error; // Re-throw for proper error handling upstream
      }
      
      throw error; // Re-throw for caller to handle
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await fetch('/api/stats', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorMessage = `Failed to fetch user stats: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const result = await safeJsonParse(response);
      return result || {
        id: 'default',
        userId: 'demo-user',
        totalPrayers: 0,
        onTimePrayers: 0,
        qazaPrayers: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectWeeks: 0,
        lastStreakUpdate: null,
        updatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      
      // Handle auth errors
      if (handleAuthError(error)) {
        throw error; // Re-throw for proper error handling upstream
      }
      
      // Return default stats if API fails
      return {
        id: 'default',
        userId: 'demo-user',
        totalPrayers: 0,
        onTimePrayers: 0,
        qazaPrayers: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectWeeks: 0,
        lastStreakUpdate: null,
        updatedAt: new Date(),
      };
    }
  }

  async updateUserStats(updates: Partial<UserStats>): Promise<UserStats> {
    const response = await apiRequest('PATCH', '/api/stats', updates);
    return await safeJsonParse(response);
  }

  async getYearlyQazaStats(): Promise<{ totalPossible: number; completed: number; qazaRemaining: number; currentYear: number }> {
    try {
      const response = await fetch('/api/stats/yearly-qaza', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorMessage = `Failed to fetch yearly Qaza stats: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const result = await safeJsonParse(response);
      return result || {
        totalPossible: 0,
        completed: 0,
        qazaRemaining: 0,
        currentYear: new Date().getFullYear()
      };
    } catch (error: any) {
      console.error('Error fetching yearly Qaza stats:', error);
      
      // Handle auth errors
      if (handleAuthError(error)) {
        throw error; // Re-throw for proper error handling upstream
      }
      
      // Return default stats if API fails
      return {
        totalPossible: 0,
        completed: 0,
        qazaRemaining: 0,
        currentYear: new Date().getFullYear()
      };
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await fetch('/api/achievements', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorMessage = `Failed to fetch achievements: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const result = await safeJsonParse(response);
      return result || [];
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      
      // Handle auth errors
      if (handleAuthError(error)) {
        throw error; // Re-throw for proper error handling upstream
      }
      
      return [];
    }
  }

  async createAchievement(achievement: Omit<Achievement, 'id' | 'userId' | 'createdAt'>): Promise<Achievement> {
    const response = await apiRequest('POST', '/api/achievements', achievement);
    return await safeJsonParse(response);
  }
}

export const apiService = new ApiService();

// Helper function to convert backend PrayerRecord to DailyPrayers format
export function convertPrayerRecordToDailyPrayers(record: PrayerRecord | null): DailyPrayers | null {
  if (!record || !record.prayers) {
    return null;
  }

  return {
    fajr: record.prayers.fajr,
    dhuhr: record.prayers.dhuhr,
    asr: record.prayers.asr,
    maghrib: record.prayers.maghrib,
    isha: record.prayers.isha,
  };
}

// Helper function to convert DailyPrayers to PrayerRecord prayers format
export function convertDailyPrayersToPrayerRecord(prayers: DailyPrayers): PrayerRecord['prayers'] {
  return {
    fajr: prayers.fajr,
    dhuhr: prayers.dhuhr,
    asr: prayers.asr,
    maghrib: prayers.maghrib,
    isha: prayers.isha,
  };
}