import { DailyPrayers } from '../contexts/prayer-context';
import { apiService, convertPrayerRecordToDailyPrayers } from './api-service';

export const prayerNames = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const prayerTimes = {
  fajr: '5:30 AM',
  dhuhr: '12:45 PM',
  asr: '4:15 PM',
  maghrib: '7:20 PM',
  isha: '8:45 PM',
};

export const prayerIcons = {
  fajr: '🌅',
  dhuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌅',
  isha: '⭐',
};

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Weekly utilities for the weekly checkbox feature

/**
 * Get the start of week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the end of week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Get all dates in a week (Monday to Sunday) as string array
 */
export function getWeekDatesArray(date: Date): string[] {
  const weekStart = getWeekStart(date);
  const dates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    dates.push(currentDate.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Generate past weeks for selection (only past weeks, not future)
 * Returns an array of week objects with start/end dates and date arrays
 */
export function getPastWeeks(numberOfWeeks: number = 12): Array<{
  startDate: string;
  endDate: string;
  dates: string[];
  weekLabel: string;
}> {
  const today = new Date();
  const weeks: Array<{
    startDate: string;
    endDate: string;
    dates: string[];
    weekLabel: string;
  }> = [];
  
  // Start from current week and go back
  for (let i = 0; i < numberOfWeeks; i++) {
    const weekDate = new Date(today);
    weekDate.setDate(today.getDate() - (i * 7));
    
    const weekStart = getWeekStart(weekDate);
    const weekEnd = getWeekEnd(weekDate);
    
    // Only include weeks that are in the past or current
    if (weekEnd <= today) {
      const dates = getWeekDatesArray(weekDate);
      const weekLabel = formatWeekLabel(weekStart, weekEnd);
      
      weeks.push({
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        dates,
        weekLabel,
      });
    }
  }
  
  return weeks; // Return in descending order (most recent first)
}

/**
 * Generate weeks from January 1st up to current week (excluding future weeks)
 * Returns an array of week objects with start/end dates and date arrays
 */
export function getWeeksFromJanuary(): Array<{
  startDate: string;
  endDate: string;
  dates: string[];
  weekLabel: string;
}> {
  const today = new Date();
  const currentYear = today.getFullYear();
  const januaryFirst = new Date(currentYear, 0, 1); // January 1st of current year
  
  const weeks: Array<{
    startDate: string;
    endDate: string;
    dates: string[];
    weekLabel: string;
  }> = [];
  
  // Start from the first week of January and go forward
  let currentWeekStart = getWeekStart(januaryFirst);
  
  while (currentWeekStart <= today) {
    const currentWeekEnd = getWeekEnd(currentWeekStart);
    
    // Only include weeks that are in the past or current (not future)
    if (currentWeekEnd <= today) {
      const dates = getWeekDatesArray(currentWeekStart);
      const weekLabel = formatWeekLabel(currentWeekStart, currentWeekEnd);
      
      weeks.push({
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: currentWeekEnd.toISOString().split('T')[0],
        dates,
        weekLabel,
      });
    }
    
    // Move to next week
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  return weeks.reverse(); // Return in descending order (most recent first)
}

/**
 * Generate months from January up to current month (excluding current month)
 * Returns an array of month objects with start/end dates and date arrays
 */
export function getPastMonthsFromJanuary(): Array<{
  startDate: string;
  endDate: string;
  dates: string[];
  monthLabel: string;
  monthName: string;
  year: number;
}> {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-based (0 = January, 11 = December)
  
  const months: Array<{
    startDate: string;
    endDate: string;
    dates: string[];
    monthLabel: string;
    monthName: string;
    year: number;
  }> = [];
  
  // Generate months from most recent back to January (descending order)
  for (let monthIndex = currentMonth - 1; monthIndex >= 0; monthIndex--) {
    const firstDay = new Date(currentYear, monthIndex, 1);
    const lastDay = new Date(currentYear, monthIndex + 1, 0); // Last day of the month
    
    const monthDates: string[] = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      monthDates.push(d.toISOString().split('T')[0]);
    }
    
    const monthName = firstDay.toLocaleDateString('en-US', { month: 'long' });
    const monthLabel = `${monthName} ${currentYear}`;
    
    months.push({
      startDate: monthDates[0],
      endDate: monthDates[monthDates.length - 1],
      dates: monthDates,
      monthLabel,
      monthName,
      year: currentYear,
    });
  }
  
  return months;
}

/**
 * Format week label for display (e.g., "Dec 9-15, 2024")
 */
export function formatWeekLabel(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

/**
 * Calculate week completion percentage based on prayer records
 */
export async function calculateWeekCompletion(dates: string[]): Promise<{
  completionPercentage: number;
  completedPrayers: number;
  totalPrayers: number;
  status: 'empty' | 'partial' | 'complete';
}> {
  try {
    const records = await apiService.getPrayerRecords(dates[0], dates[dates.length - 1]);
    
    let completedPrayers = 0;
    let totalPrayers = dates.length * 5; // 5 prayers per day
    
    dates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          if (prayer.completed) {
            completedPrayers++;
          }
        });
      }
    });
    
    const completionPercentage = totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
    
    let status: 'empty' | 'partial' | 'complete' = 'empty';
    if (completionPercentage === 100) {
      status = 'complete';
    } else if (completionPercentage > 0) {
      status = 'partial';
    }
    
    return {
      completionPercentage,
      completedPrayers,
      totalPrayers,
      status,
    };
  } catch (error) {
    console.error('Error calculating week completion:', error);
    return {
      completionPercentage: 0,
      completedPrayers: 0,
      totalPrayers: dates.length * 5,
      status: 'empty',
    };
  }
}

/**
 * Calculate month completion percentage based on prayer records
 */
export async function calculateMonthCompletion(dates: string[]): Promise<{
  completionPercentage: number;
  completedPrayers: number;
  totalPrayers: number;
  status: 'empty' | 'partial' | 'complete';
}> {
  try {
    const records = await apiService.getPrayerRecords(dates[0], dates[dates.length - 1]);
    
    let completedPrayers = 0;
    let totalPrayers = dates.length * 5; // 5 prayers per day
    
    dates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          if (prayer.completed) {
            completedPrayers++;
          }
        });
      }
    });
    
    const completionPercentage = totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
    
    let status: 'empty' | 'partial' | 'complete' = 'empty';
    if (completionPercentage === 100) {
      status = 'complete';
    } else if (completionPercentage > 0) {
      status = 'partial';
    }
    
    return {
      completionPercentage,
      completedPrayers,
      totalPrayers,
      status,
    };
  } catch (error) {
    console.error('Error calculating month completion:', error);
    return {
      completionPercentage: 0,
      completedPrayers: 0,
      totalPrayers: dates.length * 5,
      status: 'empty',
    };
  }
}

/**
 * Check if a week is in the future (should not be selectable)
 */
export function isWeekInFuture(weekEndDate: string): boolean {
  const today = new Date();
  const weekEnd = new Date(weekEndDate);
  return weekEnd > today;
}

export function getWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }
  
  return weekDates;
}

export function getMonthDates(): string[] {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const monthDates: string[] = [];
  for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
    monthDates.push(d.toISOString().split('T')[0]);
  }
  
  return monthDates;
}

export function getYearDates(): string[] {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1);
  const lastDay = new Date(today.getFullYear(), 11, 31);
  
  const yearDates: string[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    yearDates.push(d.toISOString().split('T')[0]);
  }
  
  return yearDates;
}

// Get date range for a specific time period (only up to today)
export function getDateRangeForPeriod(period: 'week' | 'month' | 'year', referenceDate?: Date): { startDate: string; endDate: string; dates: string[] } {
  const today = referenceDate || new Date();
  const todayString = today.toISOString().split('T')[0];
  
  switch (period) {
    case 'week': {
      const monday = new Date(today);
      monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
      
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Only include dates up to today
        if (dateString <= todayString) {
          weekDates.push(dateString);
        }
      }
      
      return {
        startDate: weekDates[0],
        endDate: weekDates[weekDates.length - 1],
        dates: weekDates
      };
    }
    
    case 'month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const monthDates: string[] = [];
      for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
        monthDates.push(d.toISOString().split('T')[0]);
      }
      
      return {
        startDate: monthDates[0],
        endDate: monthDates[monthDates.length - 1],
        dates: monthDates
      };
    }
    
    case 'year': {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      
      const yearDates: string[] = [];
      for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
        yearDates.push(d.toISOString().split('T')[0]);
      }
      
      return {
        startDate: yearDates[0],
        endDate: yearDates[yearDates.length - 1],
        dates: yearDates
      };
    }
    
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
}

// Get analytics data for a specific time period
export async function getAnalyticsDataForPeriod(period: 'week' | 'month' | 'year') {
  try {
    const { startDate, endDate, dates } = getDateRangeForPeriod(period);
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    const prayerStats = {
      fajr: { completed: 0, total: 0 },
      dhuhr: { completed: 0, total: 0 },
      asr: { completed: 0, total: 0 },
      maghrib: { completed: 0, total: 0 },
      isha: { completed: 0, total: 0 },
    };
    
    dates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          Object.entries(prayers).forEach(([prayerName, prayer]) => {
            const prayerKey = prayerName as keyof typeof prayerStats;
            prayerStats[prayerKey].total++;
            if (prayer.completed) {
              prayerStats[prayerKey].completed++;
            }
          });
        }
      } else {
        // Count missing days as incomplete
        Object.keys(prayerStats).forEach(prayer => {
          prayerStats[prayer as keyof typeof prayerStats].total++;
        });
      }
    });
    
    return prayerStats;
  } catch (error) {
    console.error('Failed to get analytics data from API:', error);
    // Fallback to local storage for the requested period
    const { dates } = getDateRangeForPeriod(period);
    const prayerStats = {
      fajr: { completed: 0, total: 0 },
      dhuhr: { completed: 0, total: 0 },
      asr: { completed: 0, total: 0 },
      maghrib: { completed: 0, total: 0 },
      isha: { completed: 0, total: 0 },
    };
    
    dates.forEach(date => {
      const stored = localStorage.getItem(`prayers-${date}`);
      if (stored) {
        const prayers: DailyPrayers = JSON.parse(stored);
        Object.entries(prayers).forEach(([prayerName, prayer]) => {
          const prayerKey = prayerName as keyof typeof prayerStats;
          prayerStats[prayerKey].total++;
          if (prayer.completed) {
            prayerStats[prayerKey].completed++;
          }
        });
      } else {
        Object.keys(prayerStats).forEach(prayer => {
          prayerStats[prayer as keyof typeof prayerStats].total++;
        });
      }
    });
    
    return prayerStats;
  }
}

// Get trend chart data for a specific time period
export async function getTrendDataForPeriod(period: 'week' | 'month' | 'year') {
  try {
    const { startDate, endDate, dates } = getDateRangeForPeriod(period);
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    // Generate labels based on period
    let labels: string[];
    let dataPoints: number[];
    
    if (period === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      dataPoints = dates.map(date => {
        const record = records.find(r => r.date === date);
        if (record && record.prayers) {
          const prayers = convertPrayerRecordToDailyPrayers(record);
          return prayers ? getTodayCompletedCount(prayers) : 0;
        }
        return 0;
      });
    } else if (period === 'month') {
      // Group by week for month view
      const weekGroups: { [key: string]: number[] } = {};
      dates.forEach((date, index) => {
        const dateObj = new Date(date);
        const weekOfMonth = Math.ceil((dateObj.getDate() + new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getDay()) / 7);
        const weekKey = `Week ${weekOfMonth}`;
        
        if (!weekGroups[weekKey]) weekGroups[weekKey] = [];
        
        const record = records.find(r => r.date === date);
        let completed = 0;
        if (record && record.prayers) {
          const prayers = convertPrayerRecordToDailyPrayers(record);
          completed = prayers ? getTodayCompletedCount(prayers) : 0;
        }
        weekGroups[weekKey].push(completed);
      });
      
      labels = Object.keys(weekGroups);
      dataPoints = labels.map(week => {
        const weekData = weekGroups[week];
        return Math.round(weekData.reduce((sum, val) => sum + val, 0) / weekData.length);
      });
    } else {
      // Group by month for year view
      const monthGroups: { [key: string]: number[] } = {};
      dates.forEach(date => {
        const dateObj = new Date(date);
        const monthKey = dateObj.toLocaleString('default', { month: 'short' });
        
        if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
        
        const record = records.find(r => r.date === date);
        let completed = 0;
        if (record && record.prayers) {
          const prayers = convertPrayerRecordToDailyPrayers(record);
          completed = prayers ? getTodayCompletedCount(prayers) : 0;
        }
        monthGroups[monthKey].push(completed);
      });
      
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dataPoints = labels.map(month => {
        const monthData = monthGroups[month] || [];
        return monthData.length > 0 ? Math.round(monthData.reduce((sum, val) => sum + val, 0) / monthData.length) : 0;
      });
    }
    
    return {
      labels,
      dataPoints,
      period
    };
  } catch (error) {
    console.error('Failed to get trend data from API:', error);
    // Fallback to localStorage
    const { dates } = getDateRangeForPeriod(period);
    const labels = period === 'week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : period === 'month'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dataPoints = labels.map((_, index) => {
      if (period === 'week' && index < dates.length) {
        const stored = localStorage.getItem(`prayers-${dates[index]}`);
        if (stored) {
          const prayers: DailyPrayers = JSON.parse(stored);
          return getTodayCompletedCount(prayers);
        }
      }
      return 0;
    });
    
    return { labels, dataPoints, period };
  }
}

// Get summary statistics for a time period
export async function getPeriodSummary(period: 'week' | 'month' | 'year') {
  try {
    const { startDate, endDate, dates } = getDateRangeForPeriod(period);
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let totalPrayers = 0;
    let completedPrayers = 0;
    let onTimePrayers = 0;
    
    dates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          totalPrayers++;
          if (prayer.completed) {
            completedPrayers++;
            if (prayer.onTime) {
              onTimePrayers++;
            }
          }
        });
      } else {
        totalPrayers += 5; // 5 prayers per day
      }
    });
    
    const qazaPrayers = totalPrayers - completedPrayers;
    const successRate = totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
    
    return {
      totalPrayers: completedPrayers,
      totalPossible: totalPrayers,
      successRate,
      qazaPrayers,
      onTimePrayers,
      period
    };
  } catch (error) {
    console.error('Failed to get period summary from API:', error);
    return {
      totalPrayers: 0,
      totalPossible: 0,
      successRate: 0,
      qazaPrayers: 0,
      onTimePrayers: 0,
      period
    };
  }
}

export async function calculateWeekProgressFromAPI(): Promise<number> {
  try {
    const weekDates = getWeekDates();
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let totalPrayers = 0;
    let completedPrayers = 0;
    
    weekDates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          totalPrayers++;
          if (prayer.completed) completedPrayers++;
        });
      } else {
        totalPrayers += 5; // 5 prayers per day if no record
      }
    });
    
    return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
  } catch (error) {
    console.warn('Failed to calculate week progress from API, falling back to localStorage:', error);
    return calculateWeekProgress();
  }
}

export function calculateWeekProgress(): number {
  const weekDates = getWeekDates();
  let totalPrayers = 0;
  let completedPrayers = 0;
  
  weekDates.forEach(date => {
    const stored = localStorage.getItem(`prayers-${date}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.values(prayers).forEach(prayer => {
        totalPrayers++;
        if (prayer.completed) completedPrayers++;
      });
    } else {
      totalPrayers += 5; // 5 prayers per day
    }
  });
  
  return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
}

export function calculateMonthProgress(): number {
  const monthDates = getMonthDates();
  let totalPrayers = 0;
  let completedPrayers = 0;
  
  monthDates.forEach(date => {
    const stored = localStorage.getItem(`prayers-${date}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.values(prayers).forEach(prayer => {
        totalPrayers++;
        if (prayer.completed) completedPrayers++;
      });
    } else {
      totalPrayers += 5; // 5 prayers per day
    }
  });
  
  return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
}

export function getTodayCompletedCount(prayers: DailyPrayers): number {
  return Object.values(prayers).filter(prayer => prayer.completed).length;
}

// Enhanced achievement checking with multiple types
export async function checkAchievements(prayers: DailyPrayers, weekProgress: number, currentStreak: number, userStats?: any) {
  const achievements: Array<{ 
    type: string;
    title: string; 
    description: string;
    metadata?: any;
  }> = [];
  
  const todayCompleted = getTodayCompletedCount(prayers);
  const today = getTodayString();
  
  // Perfect Day Achievement
  if (todayCompleted === 5) {
    achievements.push({
      type: 'perfect_day',
      title: "Perfect Day",
      description: "All 5 prayers completed today!",
      metadata: { date: today, onTimePrayers: Object.values(prayers).filter(p => p.onTime).length }
    });
  }
  
  // Perfect Week Achievement
  if (weekProgress === 100) {
    const weekDates = getWeekDates();
    achievements.push({
      type: 'perfect_week',
      title: "Perfect Week",
      description: "All 35 prayers completed this week!",
      metadata: {
        weekNumber: getWeekNumber(new Date()),
        year: new Date().getFullYear(),
        dateRange: { start: weekDates[0], end: weekDates[6] }
      }
    });
  }
  
  // Streak Achievements
  const streakAchievements = checkStreakAchievements(currentStreak);
  achievements.push(...streakAchievements);
  
  // Prayer Count Milestones
  if (userStats) {
    const milestoneAchievements = checkPrayerMilestones(userStats.totalPrayers || 0);
    achievements.push(...milestoneAchievements);
    
    // Consistency Achievements
    const consistencyAchievements = await checkConsistencyAchievements(userStats);
    achievements.push(...consistencyAchievements);
  }
  
  // Perfect Month Achievement (check if we're at month end)
  const monthProgress = await calculateMonthProgressFromAPI();
  if (monthProgress === 100 && isEndOfMonth()) {
    achievements.push({
      type: 'perfect_month',
      title: "Perfect Month",
      description: "All prayers completed this month!",
      metadata: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
    });
  }
  
  // Early Bird Achievements (Fajr consistency)
  const earlyBirdAchievements = await checkEarlyBirdAchievements();
  achievements.push(...earlyBirdAchievements);
  
  // Night Owl Achievements (Isha consistency)
  const nightOwlAchievements = await checkNightOwlAchievements();
  achievements.push(...nightOwlAchievements);
  
  // Golden Hour Achievements (Maghrib consistency)
  const goldenHourAchievements = await checkGoldenHourAchievements();
  achievements.push(...goldenHourAchievements);
  
  // Weekend Warrior Achievements
  const weekendWarriorAchievements = await checkWeekendWarriorAchievements();
  achievements.push(...weekendWarriorAchievements);
  
  // Dedication Achievements (Weekend streaks)
  const dedicationAchievements = await checkDedicationAchievements();
  achievements.push(...dedicationAchievements);
  
  // Comeback Achievements
  const comebackAchievements = await checkComebackAchievements();
  achievements.push(...comebackAchievements);
  
  // Monthly Champion Achievements
  const monthlyChampionAchievements = await checkMonthlyChampionAchievements();
  achievements.push(...monthlyChampionAchievements);
  
  // Seasonal Achievements
  const seasonalAchievements = await checkSeasonalAchievements();
  achievements.push(...seasonalAchievements);
  
  return achievements;
}

// Helper function to get week number
export function getWeekNumber(date: Date): number {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil(days / 7);
}

// Check if it's the end of the month
export function isEndOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.getMonth() !== today.getMonth();
}

// Check streak-based achievements
export function checkStreakAchievements(currentStreak: number): Array<{ type: string; title: string; description: string; metadata: any }> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  const streakMilestones = [7, 30, 50, 100, 200, 365];
  
  for (const milestone of streakMilestones) {
    if (currentStreak === milestone) {
      let title, description;
      
      switch (milestone) {
        case 7:
          title = "Week Warrior";
          description = "7-day prayer streak achieved!";
          break;
        case 30:
          title = "Monthly Master";
          description = "30-day prayer streak achieved!";
          break;
        case 50:
          title = "Consistency Champion";
          description = "50-day prayer streak achieved!";
          break;
        case 100:
          title = "Century Devotee";
          description = "100-day prayer streak achieved!";
          break;
        case 200:
          title = "Dedication Legend";
          description = "200-day prayer streak achieved!";
          break;
        case 365:
          title = "Yearly Devotee";
          description = "365-day prayer streak achieved!";
          break;
        default:
          title = `${milestone}-Day Streak`;
          description = `${milestone}-day prayer streak achieved!`;
      }
      
      achievements.push({
        type: 'streak_milestone',
        title,
        description,
        metadata: { streakDays: milestone, earnedDate: getTodayString() }
      });
      break; // Only award the current milestone
    }
  }
  
  return achievements;
}

// Check prayer count milestones
export function checkPrayerMilestones(totalPrayers: number): Array<{ type: string; title: string; description: string; metadata: any }> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  const prayerMilestones = [50, 100, 250, 500, 1000, 2500, 5000];
  
  for (const milestone of prayerMilestones) {
    if (totalPrayers === milestone) {
      let title, description;
      
      switch (milestone) {
        case 50:
          title = "Prayer Beginner";
          description = "50 prayers completed!";
          break;
        case 100:
          title = "Prayer Enthusiast";
          description = "100 prayers completed!";
          break;
        case 250:
          title = "Prayer Devotee";
          description = "250 prayers completed!";
          break;
        case 500:
          title = "Prayer Champion";
          description = "500 prayers completed!";
          break;
        case 1000:
          title = "Prayer Master";
          description = "1000 prayers completed!";
          break;
        case 2500:
          title = "Prayer Legend";
          description = "2500 prayers completed!";
          break;
        case 5000:
          title = "Prayer Saint";
          description = "5000 prayers completed!";
          break;
        default:
          title = `${milestone} Prayers`;
          description = `${milestone} prayers completed!`;
      }
      
      achievements.push({
        type: 'prayer_milestone',
        title,
        description,
        metadata: { totalPrayers: milestone, earnedDate: getTodayString() }
      });
      break;
    }
  }
  
  return achievements;
}

// Check consistency-based achievements
export async function checkConsistencyAchievements(userStats: any): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    // Calculate recent consistency (last 30 days)
    const monthSummary = await getPeriodSummary('month');
    const consistencyRate = monthSummary.successRate;
    
    // Early Bird Achievement - High Fajr completion rate
    const weekSummary = await getPeriodSummary('week');
    if (weekSummary.successRate >= 90) {
      // Check if this is specifically for consistent week performance
      achievements.push({
        type: 'consistency',
        title: "Consistent Devotee",
        description: "90%+ prayer completion this week!",
        metadata: {
          consistencyRate: weekSummary.successRate,
          period: 'week',
          earnedDate: getTodayString()
        }
      });
    }
    
    // Monthly Consistency
    if (consistencyRate >= 80 && isEndOfMonth()) {
      achievements.push({
        type: 'consistency',
        title: "Monthly Consistency",
        description: "80%+ prayer completion this month!",
        metadata: {
          consistencyRate,
          period: 'month',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          earnedDate: getTodayString()
        }
      });
    }
  } catch (error) {
    console.warn('Failed to check consistency achievements:', error);
  }
  
  return achievements;
}

// Calculate month progress from API
export async function calculateMonthProgressFromAPI(): Promise<number> {
  try {
    const monthSummary = await getPeriodSummary('month');
    return monthSummary.successRate;
  } catch (error) {
    console.warn('Failed to calculate month progress from API:', error);
    return calculateMonthProgress();
  }
}

export async function getWeeklyDataFromAPI() {
  try {
    const weekDates = getWeekDates();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    return weekDates.map((date, index) => {
      const record = records.find(r => r.date === date);
      let completed = 0;
      
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          completed = getTodayCompletedCount(prayers);
        }
      }
      
      return {
        day: weekDays[index],
        date,
        completed,
        total: 5,
        percentage: Math.round((completed / 5) * 100),
      };
    });
  } catch (error) {
    console.warn('Failed to get weekly data from API, falling back to localStorage:', error);
    return getWeeklyData();
  }
}

export function getWeeklyData() {
  const weekDates = getWeekDates();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return weekDates.map((date, index) => {
    const stored = localStorage.getItem(`prayers-${date}`);
    let completed = 0;
    
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      completed = getTodayCompletedCount(prayers);
    }
    
    return {
      day: weekDays[index],
      date,
      completed,
      total: 5,
      percentage: Math.round((completed / 5) * 100),
    };
  });
}

export async function getPrayerAnalyticsFromAPI() {
  try {
    const monthDates = getMonthDates();
    const startDate = monthDates[0];
    const endDate = monthDates[monthDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    const prayerStats = {
      fajr: { completed: 0, total: 0 },
      dhuhr: { completed: 0, total: 0 },
      asr: { completed: 0, total: 0 },
      maghrib: { completed: 0, total: 0 },
      isha: { completed: 0, total: 0 },
    };
    
    monthDates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          Object.entries(prayers).forEach(([prayerName, prayer]) => {
            const prayerKey = prayerName as keyof typeof prayerStats;
            prayerStats[prayerKey].total++;
            if (prayer.completed) {
              prayerStats[prayerKey].completed++;
            }
          });
        }
      } else {
        // Count missing days as incomplete
        Object.keys(prayerStats).forEach(prayer => {
          prayerStats[prayer as keyof typeof prayerStats].total++;
        });
      }
    });
    
    return prayerStats;
  } catch (error) {
    console.warn('Failed to get prayer analytics from API, falling back to localStorage:', error);
    return getPrayerAnalytics();
  }
}

export function getPrayerAnalytics() {
  const monthDates = getMonthDates();
  const prayerStats = {
    fajr: { completed: 0, total: 0 },
    dhuhr: { completed: 0, total: 0 },
    asr: { completed: 0, total: 0 },
    maghrib: { completed: 0, total: 0 },
    isha: { completed: 0, total: 0 },
  };
  
  monthDates.forEach(date => {
    const stored = localStorage.getItem(`prayers-${date}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.entries(prayers).forEach(([prayerName, prayer]) => {
        const prayerKey = prayerName as keyof typeof prayerStats;
        prayerStats[prayerKey].total++;
        if (prayer.completed) {
          prayerStats[prayerKey].completed++;
        }
      });
    } else {
      // Count missing days as incomplete
      Object.keys(prayerStats).forEach(prayer => {
        prayerStats[prayer as keyof typeof prayerStats].total++;
      });
    }
  });
  
  return prayerStats;
}

export function getCurrentStreak(): number {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) { // Check up to a year back
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const stored = localStorage.getItem(`prayers-${dateString}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      const completed = getTodayCompletedCount(prayers);
      
      if (completed === 5) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  
  return streak;
}

export function getQazaCount(): number {
  // Calculate missed prayers from the past 30 days
  let qazaCount = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const stored = localStorage.getItem(`prayers-${dateString}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.values(prayers).forEach(prayer => {
        if (!prayer.completed) {
          qazaCount++;
        }
      });
    } else {
      qazaCount += 5; // All 5 prayers missed if no data
    }
  }
  
  return qazaCount;
}

// Enhanced API-based streak calculation
export async function calculateCurrentStreakFromAPI(): Promise<number> {
  try {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);
    
    // Go backwards day by day to find consecutive prayer completion
    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      const record = await apiService.getPrayerRecord(dateString);
      
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          // Check if all 5 prayers were completed for this day
          const allCompleted = Object.values(prayers).every(prayer => prayer.completed);
          if (allCompleted) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break; // Streak broken
          }
        } else {
          break;
        }
      } else {
        // No record means no prayers completed
        break;
      }
      
      // Limit to reasonable check period (1 year)
      if (streak > 365) break;
    }
    
    return streak;
  } catch (error) {
    console.error('Failed to calculate streak from API:', error);
    return getCurrentStreak(); // Fallback to localStorage
  }
}

// Enhanced API-based qaza count calculation
export async function calculateQazaCountFromAPI(): Promise<number> {
  try {
    const { startDate, endDate, dates } = getDateRangeForPeriod('month');
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let qazaCount = 0;
    
    dates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          if (!prayer.completed) {
            qazaCount++;
          }
        });
      } else {
        // No record means all 5 prayers missed
        qazaCount += 5;
      }
    });
    
    return qazaCount;
  } catch (error) {
    console.error('Failed to calculate qaza count from API:', error);
    return getQazaCount(); // Fallback to localStorage
  }
}

// Calculate comprehensive user statistics
export async function calculateUserStatistics(userId?: string): Promise<{
  totalPrayers: number;
  onTimePrayers: number;
  qazaPrayers: number;
  currentStreak: number;
  bestStreak: number;
  perfectWeeks: number;
}> {
  try {
    // Get data for the past year to calculate comprehensive stats
    const { startDate, endDate } = getDateRangeForPeriod('year');
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let totalPrayers = 0;
    let onTimePrayers = 0;
    let qazaPrayers = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let perfectWeeks = 0;
    
    // Calculate current streak
    currentStreak = await calculateCurrentStreakFromAPI();
    
    // Calculate historical streaks to find best streak
    let tempStreak = 0;
    const sortedRecords = records.sort((a, b) => a.date.localeCompare(b.date));
    
    sortedRecords.forEach(record => {
      if (record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          // Count prayers for this day
          Object.values(prayers).forEach(prayer => {
            totalPrayers++;
            if (prayer.completed) {
              if (prayer.onTime) {
                onTimePrayers++;
              }
            } else {
              qazaPrayers++;
            }
          });
          
          // Check if all prayers completed for streak calculation
          const allCompleted = Object.values(prayers).every(prayer => prayer.completed);
          if (allCompleted) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }
      } else {
        // No prayers recorded - break streak and add to qaza
        qazaPrayers += 5;
        tempStreak = 0;
      }
    });
    
    // Calculate perfect weeks
    const weekGroups = getWeekGroupsFromRecords(records);
    perfectWeeks = weekGroups.filter(week => week.completionRate === 100).length;
    
    return {
      totalPrayers: totalPrayers - qazaPrayers, // Only count completed prayers
      onTimePrayers,
      qazaPrayers,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      perfectWeeks,
    };
  } catch (error) {
    console.error('Failed to calculate user statistics:', error);
    return {
      totalPrayers: 0,
      onTimePrayers: 0,
      qazaPrayers: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfectWeeks: 0,
    };
  }
}

// Helper function to group records by week
function getWeekGroupsFromRecords(records: any[]): Array<{ completionRate: number }> {
  const weeks: { [key: string]: { completed: number; total: number } } = {};
  
  records.forEach(record => {
    const date = new Date(record.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = { completed: 0, total: 0 };
    }
    
    if (record.prayers) {
      const prayers = convertPrayerRecordToDailyPrayers(record);
      if (prayers) {
        Object.values(prayers).forEach(prayer => {
          weeks[weekKey].total++;
          if (prayer.completed) {
            weeks[weekKey].completed++;
          }
        });
      }
    } else {
      weeks[weekKey].total += 5;
    }
  });
  
  return Object.values(weeks).map(week => ({
    completionRate: week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0
  }));
}

// Update user statistics in backend
export async function updateUserStatisticsInBackend(newPrayers: DailyPrayers): Promise<void> {
  try {
    // Calculate comprehensive statistics
    const stats = await calculateUserStatistics();
    
    // Update the backend with new statistics
    await apiService.updateUserStats({
      totalPrayers: stats.totalPrayers,
      onTimePrayers: stats.onTimePrayers,
      qazaPrayers: stats.qazaPrayers,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      perfectWeeks: stats.perfectWeeks,
      lastStreakUpdate: getTodayString(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to update user statistics in backend:', error);
  }
}

// Real-time statistics calculation for immediate UI updates
export function calculateRealTimeStatistics(newPrayers: DailyPrayers, currentStats: any): {
  currentStreak: number;
  qazaCount: number;
  shouldUpdateBackend: boolean;
} {
  const todayCompleted = getTodayCompletedCount(newPrayers);
  const todayPerfect = todayCompleted === 5;
  
  // Calculate immediate streak impact
  let newCurrentStreak = currentStats.currentStreak || 0;
  let qazaChange = 0;
  
  // Count missed prayers for today
  const missedToday = 5 - todayCompleted;
  
  // If today is perfect, potentially extend streak
  if (todayPerfect) {
    // We'll verify this with API call later
    newCurrentStreak = currentStats.currentStreak + 1;
  } else if (missedToday > 0) {
    // Reset streak if prayers were missed
    newCurrentStreak = 0;
    qazaChange = missedToday;
  }
  
  return {
    currentStreak: newCurrentStreak,
    qazaCount: (currentStats.qazaCount || 0) + qazaChange,
    shouldUpdateBackend: true, // Always update backend for accuracy
  };
}

// Calculate how many Qaza prayers remain for the current year
export async function getYearlyQazaRemaining(): Promise<number> {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const currentDate = new Date();
    
    // Calculate total days from start of year to today (inclusive)
    const daysSinceStartOfYear = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Total possible prayers for the year so far (5 prayers per day)
    const totalPossible = daysSinceStartOfYear * 5;
    
    // Get year dates up to today
    const yearDates = getYearDates().filter(date => date <= getTodayString());
    const startDate = yearDates[0];
    const endDate = yearDates[yearDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let completedPrayers = 0;
    
    yearDates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          if (prayer.completed) completedPrayers++;
        });
      }
    });
    
    // Qaza prayers = Total possible - Completed prayers
    return Math.max(0, totalPossible - completedPrayers);
  } catch (error) {
    console.error('Failed to get yearly Qaza remaining from API, falling back to localStorage:', error);
    
    // Fallback to localStorage
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const daysSinceStartOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPossible = daysSinceStartOfYear * 5;
    
    const yearDates = getYearDates().filter(date => date <= getTodayString());
    let completedPrayers = 0;
    
    yearDates.forEach(date => {
      const stored = localStorage.getItem(`prayers-${date}`);
      if (stored) {
        const prayers: DailyPrayers = JSON.parse(stored);
        Object.values(prayers).forEach(prayer => {
          if (prayer.completed) completedPrayers++;
        });
      }
    });
    
    return Math.max(0, totalPossible - completedPrayers);
  }
}

// Get comprehensive yearly statistics including total possible prayers, completed, and remaining
export async function getYearlyQazaStats(): Promise<{
  totalPossible: number;
  completed: number;
  qazaRemaining: number;
  currentYear: number;
}> {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    
    // Calculate total days from start of year to today (inclusive)
    const daysSinceStartOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Total possible prayers for the year so far (5 prayers per day)
    const totalPossible = daysSinceStartOfYear * 5;
    
    // Get year dates up to today
    const yearDates = getYearDates().filter(date => date <= getTodayString());
    const startDate = yearDates[0];
    const endDate = yearDates[yearDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let completed = 0;
    
    yearDates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          if (prayer.completed) completed++;
        });
      }
    });
    
    const qazaRemaining = Math.max(0, totalPossible - completed);
    
    return {
      totalPossible,
      completed,
      qazaRemaining,
      currentYear
    };
  } catch (error) {
    console.error('Failed to get yearly Qaza stats from API, falling back to localStorage:', error);
    
    // Fallback to localStorage
    const today = new Date();
    const currentYear = today.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const daysSinceStartOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPossible = daysSinceStartOfYear * 5;
    
    const yearDates = getYearDates().filter(date => date <= getTodayString());
    let completed = 0;
    
    yearDates.forEach(date => {
      const stored = localStorage.getItem(`prayers-${date}`);
      if (stored) {
        const prayers: DailyPrayers = JSON.parse(stored);
        Object.values(prayers).forEach(prayer => {
          if (prayer.completed) completed++;
        });
      }
    });
    
    const qazaRemaining = Math.max(0, totalPossible - completed);
    
    return {
      totalPossible,
      completed,
      qazaRemaining,
      currentYear
    };
  }
}

// Check Early Bird achievements (Fajr consistency)
export async function checkEarlyBirdAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const milestones = [3, 7, 15, 30, 60, 100];
    
    for (const milestone of milestones) {
      const consecutiveDays = await checkConsecutivePrayerCompletion('fajr', milestone);
      
      if (consecutiveDays >= milestone) {
        let title, description;
        
        switch (milestone) {
          case 3:
            title = "Early Starter";
            description = "3 consecutive days of Fajr prayers!";
            break;
          case 7:
            title = "Dawn Devotee";
            description = "1 week of consistent Fajr prayers!";
            break;
          case 15:
            title = "Morning Master";
            description = "15 days of Fajr dedication!";
            break;
          case 30:
            title = "Fajr Champion";
            description = "30 days of early morning devotion!";
            break;
          case 60:
            title = "Early Bird Legend";
            description = "60 days of Fajr consistency!";
            break;
          case 100:
            title = "Dawn Guardian";
            description = "100 days of Fajr mastery!";
            break;
          default:
            title = `Early Bird ${milestone}`;
            description = `${milestone} consecutive Fajr prayers!`;
        }
        
        achievements.push({
          type: 'early_bird',
          title,
          description,
          metadata: {
            consecutiveDays: milestone,
            prayerType: 'fajr',
            earnedDate: getTodayString()
          }
        });
        break; // Only award the current milestone
      }
    }
  } catch (error) {
    console.warn('Failed to check Early Bird achievements:', error);
  }
  
  return achievements;
}

// Check Night Owl achievements (Isha consistency)
export async function checkNightOwlAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const milestones = [3, 7, 15, 30, 60, 100];
    
    for (const milestone of milestones) {
      const consecutiveDays = await checkConsecutivePrayerCompletion('isha', milestone);
      
      if (consecutiveDays >= milestone) {
        let title, description;
        
        switch (milestone) {
          case 3:
            title = "Night Starter";
            description = "3 consecutive nights of Isha prayers!";
            break;
          case 7:
            title = "Evening Devotee";
            description = "1 week of consistent Isha prayers!";
            break;
          case 15:
            title = "Night Master";
            description = "15 nights of Isha dedication!";
            break;
          case 30:
            title = "Isha Champion";
            description = "30 nights of evening devotion!";
            break;
          case 60:
            title = "Night Owl Legend";
            description = "60 nights of Isha consistency!";
            break;
          case 100:
            title = "Night Guardian";
            description = "100 nights of Isha mastery!";
            break;
          default:
            title = `Night Owl ${milestone}`;
            description = `${milestone} consecutive Isha prayers!`;
        }
        
        achievements.push({
          type: 'night_owl',
          title,
          description,
          metadata: {
            consecutiveDays: milestone,
            prayerType: 'isha',
            earnedDate: getTodayString()
          }
        });
        break; // Only award the current milestone
      }
    }
  } catch (error) {
    console.warn('Failed to check Night Owl achievements:', error);
  }
  
  return achievements;
}

// Check Golden Hour achievements (Maghrib consistency)
export async function checkGoldenHourAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const milestones = [3, 7, 15, 30, 60, 100];
    
    for (const milestone of milestones) {
      const consecutiveDays = await checkConsecutivePrayerCompletion('maghrib', milestone);
      
      if (consecutiveDays >= milestone) {
        let title, description;
        
        switch (milestone) {
          case 3:
            title = "Sunset Starter";
            description = "3 consecutive days of Maghrib prayers!";
            break;
          case 7:
            title = "Golden Devotee";
            description = "1 week of consistent Maghrib prayers!";
            break;
          case 15:
            title = "Sunset Master";
            description = "15 days of Maghrib dedication!";
            break;
          case 30:
            title = "Maghrib Champion";
            description = "30 days of golden hour devotion!";
            break;
          case 60:
            title = "Golden Hour Legend";
            description = "60 days of Maghrib consistency!";
            break;
          case 100:
            title = "Sunset Guardian";
            description = "100 days of Maghrib mastery!";
            break;
          default:
            title = `Golden Hour ${milestone}`;
            description = `${milestone} consecutive Maghrib prayers!`;
        }
        
        achievements.push({
          type: 'golden_hour',
          title,
          description,
          metadata: {
            consecutiveDays: milestone,
            prayerType: 'maghrib',
            earnedDate: getTodayString()
          }
        });
        break; // Only award the current milestone
      }
    }
  } catch (error) {
    console.warn('Failed to check Golden Hour achievements:', error);
  }
  
  return achievements;
}

// Check Weekend Warrior achievements
export async function checkWeekendWarriorAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const milestones = [1, 2, 4, 8, 12, 24];
    
    for (const milestone of milestones) {
      const perfectWeekends = await countPerfectWeekends();
      
      if (perfectWeekends >= milestone) {
        let title, description;
        
        switch (milestone) {
          case 1:
            title = "Weekend Starter";
            description = "First perfect weekend achieved!";
            break;
          case 2:
            title = "Weekend Enthusiast";
            description = "2 perfect weekends completed!";
            break;
          case 4:
            title = "Weekend Champion";
            description = "4 perfect weekends in a month!";
            break;
          case 8:
            title = "Weekend Master";
            description = "8 perfect weekends achieved!";
            break;
          case 12:
            title = "Weekend Legend";
            description = "12 perfect weekends completed!";
            break;
          case 24:
            title = "Weekend Guardian";
            description = "24 perfect weekends mastered!";
            break;
          default:
            title = `Weekend Warrior ${milestone}`;
            description = `${milestone} perfect weekends achieved!`;
        }
        
        achievements.push({
          type: 'weekend_warrior',
          title,
          description,
          metadata: {
            perfectWeekends: milestone,
            earnedDate: getTodayString()
          }
        });
        break; // Only award the current milestone
      }
    }
  } catch (error) {
    console.warn('Failed to check Weekend Warrior achievements:', error);
  }
  
  return achievements;
}

// Check Dedication achievements (Weekend streaks)
export async function checkDedicationAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const milestones = [3, 7, 15, 30];
    
    for (const milestone of milestones) {
      const consecutiveWeekends = await checkConsecutiveWeekendStreaks();
      
      if (consecutiveWeekends >= milestone) {
        let title, description;
        
        switch (milestone) {
          case 3:
            title = "Dedicated Beginner";
            description = "3 consecutive perfect weekends!";
            break;
          case 7:
            title = "Weekend Devotee";
            description = "7 consecutive perfect weekends!";
            break;
          case 15:
            title = "Dedication Master";
            description = "15 consecutive perfect weekends!";
            break;
          case 30:
            title = "Ultimate Dedication";
            description = "30 consecutive perfect weekends!";
            break;
          default:
            title = `Dedication ${milestone}`;
            description = `${milestone} consecutive perfect weekends!`;
        }
        
        achievements.push({
          type: 'dedication',
          title,
          description,
          metadata: {
            consecutiveWeekends: milestone,
            earnedDate: getTodayString()
          }
        });
        break; // Only award the current milestone
      }
    }
  } catch (error) {
    console.warn('Failed to check Dedication achievements:', error);
  }
  
  return achievements;
}

// Check Comeback achievements
export async function checkComebackAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const milestones = [3, 7, 15, 30];
    
    for (const milestone of milestones) {
      const isComeback = await checkIfComebackStreak(milestone);
      
      if (isComeback) {
        let title, description;
        
        switch (milestone) {
          case 3:
            title = "Fresh Start";
            description = "3 days back on track after missing prayers!";
            break;
          case 7:
            title = "Comeback Kid";
            description = "1 week of prayers after a setback!";
            break;
          case 15:
            title = "Resilient Soul";
            description = "15 days of recovery and dedication!";
            break;
          case 30:
            title = "Phoenix Rising";
            description = "30 days of comeback dedication!";
            break;
          default:
            title = `Comeback ${milestone}`;
            description = `${milestone} days of recovery after missed prayers!`;
        }
        
        achievements.push({
          type: 'comeback',
          title,
          description,
          metadata: {
            comebackDays: milestone,
            earnedDate: getTodayString()
          }
        });
        break; // Only award the current milestone
      }
    }
  } catch (error) {
    console.warn('Failed to check Comeback achievements:', error);
  }
  
  return achievements;
}

// Check Monthly Champion achievements
export async function checkMonthlyChampionAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const milestones = [1, 2, 3, 6, 12];
    
    for (const milestone of milestones) {
      const perfectMonths = await countPerfectMonths();
      
      if (perfectMonths >= milestone) {
        let title, description;
        
        switch (milestone) {
          case 1:
            title = "Monthly Achiever";
            description = "First perfect month completed!";
            break;
          case 2:
            title = "Bi-Monthly Champion";
            description = "2 perfect months achieved!";
            break;
          case 3:
            title = "Quarterly Master";
            description = "3 perfect months completed!";
            break;
          case 6:
            title = "Half-Year Champion";
            description = "6 perfect months achieved!";
            break;
          case 12:
            title = "Yearly Champion";
            description = "12 perfect months - A full year!";
            break;
          default:
            title = `Monthly Champion ${milestone}`;
            description = `${milestone} perfect months achieved!`;
        }
        
        achievements.push({
          type: 'monthly_champion',
          title,
          description,
          metadata: {
            perfectMonths: milestone,
            earnedDate: getTodayString()
          }
        });
        break; // Only award the current milestone
      }
    }
  } catch (error) {
    console.warn('Failed to check Monthly Champion achievements:', error);
  }
  
  return achievements;
}

// Check Seasonal achievements
export async function checkSeasonalAchievements(): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    
    // Check for Ramadan (approximate - month 9 in Islamic calendar, but using month check for simplicity)
    if (currentMonth === 4 && isEndOfMonth()) { // April as example Ramadan month
      const monthProgress = await calculateMonthProgressFromAPI();
      if (monthProgress === 100) {
        achievements.push({
          type: 'seasonal',
          title: "Ramadan Champion",
          description: "Perfect prayers throughout the holy month!",
          metadata: {
            specialMonth: 'Ramadan',
            month: currentMonth,
            year: currentYear,
            earnedDate: getTodayString()
          }
        });
      }
    }
    
    // Check for perfect prayers during Dhul Hijjah (month 12)
    if (currentMonth === 7 && isEndOfMonth()) { // July as example Dhul Hijjah month
      const monthProgress = await calculateMonthProgressFromAPI();
      if (monthProgress === 100) {
        achievements.push({
          type: 'seasonal',
          title: "Hajj Month Devotee",
          description: "Perfect prayers during Dhul Hijjah!",
          metadata: {
            specialMonth: 'Dhul Hijjah',
            month: currentMonth,
            year: currentYear,
            earnedDate: getTodayString()
          }
        });
      }
    }
  } catch (error) {
    console.warn('Failed to check Seasonal achievements:', error);
  }
  
  return achievements;
}

// Helper function to check consecutive prayer completion for a specific prayer
export async function checkConsecutivePrayerCompletion(prayerType: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', targetDays: number): Promise<number> {
  try {
    let consecutiveDays = 0;
    const today = new Date();
    
    for (let i = 0; i < targetDays + 10; i++) { // Check a few extra days to be sure
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const record = await apiService.getPrayerRecord(dateString);
      
      if (record && record.prayers && record.prayers[prayerType] && record.prayers[prayerType].completed) {
        consecutiveDays++;
      } else {
        break; // Streak broken
      }
    }
    
    return consecutiveDays;
  } catch (error) {
    console.error(`Failed to check consecutive ${prayerType} completion:`, error);
    return 0;
  }
}

// Helper function to count perfect weekends
export async function countPerfectWeekends(): Promise<number> {
  try {
    const { startDate, endDate } = getDateRangeForPeriod('year');
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let perfectWeekends = 0;
    const weekends: { [key: string]: { saturday: boolean; sunday: boolean } } = {};
    
    records.forEach(record => {
      const date = new Date(record.date);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
        const weekKey = getWeekStart(date).toISOString().split('T')[0];
        
        if (!weekends[weekKey]) {
          weekends[weekKey] = { saturday: false, sunday: false };
        }
        
        if (record.prayers) {
          const prayers = convertPrayerRecordToDailyPrayers(record);
          if (prayers) {
            const allCompleted = Object.values(prayers).every(prayer => prayer.completed);
            if (dayOfWeek === 6) weekends[weekKey].saturday = allCompleted;
            if (dayOfWeek === 0) weekends[weekKey].sunday = allCompleted;
          }
        }
      }
    });
    
    // Count weekends where both Saturday and Sunday were perfect
    Object.values(weekends).forEach(weekend => {
      if (weekend.saturday && weekend.sunday) {
        perfectWeekends++;
      }
    });
    
    return perfectWeekends;
  } catch (error) {
    console.error('Failed to count perfect weekends:', error);
    return 0;
  }
}

// Helper function to check consecutive weekend streaks
export async function checkConsecutiveWeekendStreaks(): Promise<number> {
  try {
    let consecutiveWeekends = 0;
    const today = new Date();
    let currentWeekStart = getWeekStart(today);
    
    // Go back weekend by weekend
    for (let i = 0; i < 52; i++) { // Check up to a year of weekends
      const saturday = new Date(currentWeekStart);
      saturday.setDate(currentWeekStart.getDate() + 5);
      const sunday = new Date(currentWeekStart);
      sunday.setDate(currentWeekStart.getDate() + 6);
      
      const saturdayRecord = await apiService.getPrayerRecord(saturday.toISOString().split('T')[0]);
      const sundayRecord = await apiService.getPrayerRecord(sunday.toISOString().split('T')[0]);
      
      let weekendPerfect = true;
      
      // Check Saturday
      if (saturdayRecord && saturdayRecord.prayers) {
        const saturdayPrayers = convertPrayerRecordToDailyPrayers(saturdayRecord);
        if (!saturdayPrayers || !Object.values(saturdayPrayers).every(prayer => prayer.completed)) {
          weekendPerfect = false;
        }
      } else {
        weekendPerfect = false;
      }
      
      // Check Sunday
      if (sundayRecord && sundayRecord.prayers) {
        const sundayPrayers = convertPrayerRecordToDailyPrayers(sundayRecord);
        if (!sundayPrayers || !Object.values(sundayPrayers).every(prayer => prayer.completed)) {
          weekendPerfect = false;
        }
      } else {
        weekendPerfect = false;
      }
      
      if (weekendPerfect) {
        consecutiveWeekends++;
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      } else {
        break;
      }
    }
    
    return consecutiveWeekends;
  } catch (error) {
    console.error('Failed to check consecutive weekend streaks:', error);
    return 0;
  }
}

// Helper function to check if current streak is a comeback after missed prayers
export async function checkIfComebackStreak(targetDays: number): Promise<boolean> {
  try {
    const today = new Date();
    let currentStreak = 0;
    let foundMissedPrayers = false;
    
    // Check current streak
    for (let i = 0; i < targetDays + 5; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const record = await apiService.getPrayerRecord(dateString);
      
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          const allCompleted = Object.values(prayers).every(prayer => prayer.completed);
          if (allCompleted) {
            currentStreak++;
          } else {
            if (currentStreak >= targetDays) {
              foundMissedPrayers = true;
              break;
            }
            return false;
          }
        }
      } else {
        if (currentStreak >= targetDays) {
          foundMissedPrayers = true;
          break;
        }
        return false;
      }
    }
    
    return currentStreak >= targetDays && foundMissedPrayers;
  } catch (error) {
    console.error('Failed to check comeback streak:', error);
    return false;
  }
}

// Helper function to count perfect months
export async function countPerfectMonths(): Promise<number> {
  try {
    const { startDate, endDate } = getDateRangeForPeriod('year');
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    const months: { [key: string]: { completed: number; total: number } } = {};
    
    // Group records by month
    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { completed: 0, total: 0 };
      }
      
      if (record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          months[monthKey].total++;
          if (prayer.completed) {
            months[monthKey].completed++;
          }
        });
      } else {
        months[monthKey].total += 5;
      }
    });
    
    // Count months with 100% completion
    let perfectMonths = 0;
    Object.values(months).forEach(month => {
      if (month.total > 0 && month.completed === month.total) {
        perfectMonths++;
      }
    });
    
    return perfectMonths;
  } catch (error) {
    console.error('Failed to count perfect months:', error);
    return 0;
  }
}

// Helper function to get Hijri date (simple approximation)
export function getHijriDate(gregorianDate?: Date): string {
  const date = gregorianDate || new Date();
  
  // Hijri calendar is approximately 354 days long, so it's ~11 days shorter than Gregorian
  // Hijri epoch: July 16, 622 CE (Gregorian)
  const hijriEpoch = new Date(622, 6, 16).getTime();
  const daysSinceEpoch = (date.getTime() - hijriEpoch) / (1000 * 60 * 60 * 24);
  
  // Approximate Hijri year (354.36 days per year)
  const hijriYear = Math.floor(daysSinceEpoch / 354.36);
  const dayInYear = Math.floor(daysSinceEpoch % 354.36);
  
  // Approximate month (29.5 days per month on average)
  const month = Math.floor(dayInYear / 29.5) % 12;
  const day = Math.floor(dayInYear % 29.5) + 1;
  
  const hijriMonths = [
    "Muharram", "Safar", "Rabi' I", "Rabi' II", "Jumada I", "Jumada II",
    "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
  ];
  
  return `${day} ${hijriMonths[month]} ${hijriYear}`;
}

// Helper function to get current time formatted
export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Helper function to determine current prayer based on time
export function getCurrentPrayer(): { name: string; emoji: string; key: string } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Convert prayer times to minutes
  const prayerMinutes = {
    fajr: 5 * 60 + 30,     // 5:30 AM
    dhuhr: 12 * 60 + 45,   // 12:45 PM
    asr: 16 * 60 + 15,     // 4:15 PM
    maghrib: 19 * 60 + 20, // 7:20 PM
    isha: 20 * 60 + 45,    // 8:45 PM
  };
  
  // Determine which prayer time is active
  if (currentMinutes >= prayerMinutes.fajr && currentMinutes < prayerMinutes.dhuhr) {
    return { name: 'Fajr', emoji: '🌅', key: 'fajr' };
  } else if (currentMinutes >= prayerMinutes.dhuhr && currentMinutes < prayerMinutes.asr) {
    return { name: 'Dhuhr', emoji: '☀️', key: 'dhuhr' };
  } else if (currentMinutes >= prayerMinutes.asr && currentMinutes < prayerMinutes.maghrib) {
    return { name: 'Asr', emoji: '🌤️', key: 'asr' };
  } else if (currentMinutes >= prayerMinutes.maghrib && currentMinutes < prayerMinutes.isha) {
    return { name: 'Maghrib', emoji: '🌅', key: 'maghrib' };
  } else if (currentMinutes >= prayerMinutes.isha || currentMinutes < prayerMinutes.fajr) {
    return { name: 'Isha', emoji: '⭐', key: 'isha' };
  }
  
  return null;
}

// Helper function to get next prayer and countdown
export function getNextPrayer(): { name: string; emoji: string; key: string; countdown: string } {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Convert prayer times to minutes
  const prayers = [
    { name: 'Fajr', emoji: '🌅', key: 'fajr', minutes: 5 * 60 + 30 },
    { name: 'Dhuhr', emoji: '☀️', key: 'dhuhr', minutes: 12 * 60 + 45 },
    { name: 'Asr', emoji: '🌤️', key: 'asr', minutes: 16 * 60 + 15 },
    { name: 'Maghrib', emoji: '🌅', key: 'maghrib', minutes: 19 * 60 + 20 },
    { name: 'Isha', emoji: '⭐', key: 'isha', minutes: 20 * 60 + 45 },
  ];
  
  // Find next prayer
  let nextPrayer = prayers.find(p => p.minutes > currentMinutes);
  let minutesUntil;
  
  if (!nextPrayer) {
    // Next prayer is Fajr tomorrow
    nextPrayer = prayers[0];
    minutesUntil = (24 * 60 - currentMinutes) + prayers[0].minutes;
  } else {
    minutesUntil = nextPrayer.minutes - currentMinutes;
  }
  
  // Format countdown
  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;
  const countdown = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  
  return {
    name: nextPrayer.name,
    emoji: nextPrayer.emoji,
    key: nextPrayer.key,
    countdown,
  };
}

// Helper function to format date for display
export function formatDateForDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options);
}

// Helper function to get calendar dates for week view with prayer data
export async function getCalendarWeekData(startDate: Date): Promise<Array<{
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  completionPercentage: number;
}>> {
  const dates: Array<{
    date: string;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
    completionPercentage: number;
  }> = [];
  
  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Get prayer data for this date
    let completionPercentage = 0;
    try {
      const record = await apiService.getPrayerRecord(dateString);
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          const completed = getTodayCompletedCount(prayers);
          completionPercentage = Math.round((completed / 5) * 100);
        }
      }
    } catch (error) {
      console.warn('Failed to get prayer data for date:', dateString, error);
    }
    
    dates.push({
      date: dateString,
      dayName: dayNames[currentDate.getDay()],
      dayNumber: currentDate.getDate(),
      isToday: dateString === today,
      completionPercentage,
    });
  }
  
  return dates;
}

// Helper function to get calendar dates for month view with prayer data
export async function getCalendarMonthData(monthDate: Date): Promise<Array<{
  date: string;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  completionPercentage: number;
}>> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  
  // Get first day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get day of week for first day (0 = Sunday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Calculate how many days from previous month to show
  const daysFromPrevMonth = firstDayOfWeek;
  
  // Calculate start date (including previous month days)
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - daysFromPrevMonth);
  
  const dates: Array<{
    date: string;
    dayNumber: number;
    isToday: boolean;
    isCurrentMonth: boolean;
    completionPercentage: number;
  }> = [];
  
  const today = new Date().toISOString().split('T')[0];
  
  // Generate 42 days (6 weeks) for calendar grid
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Get prayer data for this date
    let completionPercentage = 0;
    try {
      const record = await apiService.getPrayerRecord(dateString);
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          const completed = getTodayCompletedCount(prayers);
          completionPercentage = Math.round((completed / 5) * 100);
        }
      }
    } catch (error) {
      // Silently fail for dates without data
    }
    
    dates.push({
      date: dateString,
      dayNumber: currentDate.getDate(),
      isToday: dateString === today,
      isCurrentMonth: currentDate.getMonth() === month,
      completionPercentage,
    });
  }
  
  return dates;
}

// Helper function to format date range for calendar view
export function formatDateRange(viewType: 'week' | 'month', startDate: Date): string {
  if (viewType === 'week') {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
    const year = endDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    } else {
      return `${startMonth} - ${endMonth} ${year}`;
    }
  } else {
    return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
