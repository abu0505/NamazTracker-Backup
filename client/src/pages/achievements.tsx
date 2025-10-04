import { useState, useEffect } from 'react';
import { Flame, Clock, Mountain, Calendar, Target, Trophy, Star } from 'lucide-react';
import { AchievementCard, MilestoneProgress } from '../components/achievement-card';
import { usePrayer } from '../contexts/prayer-context';
import { Achievement, UserStats } from '@shared/schema';
import { apiService } from '@/lib/api-service';
import { getPeriodSummary } from '@/lib/prayer-utils';

export default function Achievements() {
  const { currentStreak, isLoading: contextLoading } = usePrayer();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [weekSummary, setWeekSummary] = useState<any>(null);

  useEffect(() => {
    loadAchievementsData();
  }, []);

  const loadAchievementsData = async () => {
    try {
      setIsLoading(true);
      
      // Load achievements and user stats from API
      const [achievementsData, statsData] = await Promise.all([
        apiService.getAchievements(),
        apiService.getUserStats()
      ]);
      
      setAchievements(achievementsData);
      setUserStats(statsData);
      
      // Load analytics data for milestones
      const [monthData, weekData] = await Promise.all([
        getPeriodSummary('month').catch(() => ({ successRate: 0, totalPrayers: 0, onTimePrayers: 0 })),
        getPeriodSummary('week').catch(() => ({ successRate: 0, totalPrayers: 0, onTimePrayers: 0 }))
      ]);
      
      setMonthSummary(monthData);
      setWeekSummary(weekData);
      
      // Calculate milestones based on real data
      const calculatedMilestones = calculateMilestones(statsData, monthData, weekData);
      setMilestones(calculatedMilestones);
      
    } catch (error) {
      console.error('Failed to load achievements data:', error);
      // Fallback to localStorage for achievements if API fails
      const storedAchievements = localStorage.getItem('achievements');
      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateMilestones = (stats: UserStats, monthData: any, weekData: any) => {
    const currentMonth = new Date().getMonth();
    const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
    const maxMonthlyPrayers = daysInMonth * 5;
    
    return [
      {
        title: "7-Day Streak",
        description: "Complete prayers for 7 consecutive days",
        current: Math.min(currentStreak, 7),
        target: 7,
        icon: Flame,
        color: "bg-orange-500",
      },
      {
        title: "30-Day Streak",
        description: "Complete prayers for 30 consecutive days",
        current: Math.min(currentStreak, 30),
        target: 30,
        icon: Calendar,
        color: "bg-primary",
      },
      {
        title: "100-Day Streak",
        description: "Complete prayers for 100 consecutive days",
        current: Math.min(currentStreak, 100),
        target: 100,
        icon: Trophy,
        color: "bg-yellow-500",
      },
      {
        title: "Prayer Master",
        description: "Complete 1000 prayers total",
        current: Math.min(stats.totalPrayers || 0, 1000),
        target: 1000,
        icon: Target,
        color: "bg-green-500",
      },
      {
        title: "Weekly Consistency",
        description: "80%+ prayer completion this week",
        current: weekData.successRate || 0,
        target: 80,
        icon: Star,
        color: "bg-blue-500",
      },
      {
        title: "Monthly Devotee",
        description: "Complete 80% of prayers this month",
        current: monthData.successRate || 0,
        target: 80,
        icon: Mountain,
        color: "bg-purple-500",
      },
    ];
  };


  return (
    <div className="space-y-8" data-testid="page-achievements">
      <h2 className="text-2xl font-bold text-center" data-testid="text-achievements-title">
        Achievements
      </h2>
      
      {/* Current Streak Card */}
      <div className="glass-card rounded-2xl p-6 text-center animate-float">
        <div className="w-20 h-20 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-current-streak-title">
          Current Streak
        </h3>
        <p className="text-3xl font-bold text-primary mb-2" data-testid="text-current-streak-value">
          {currentStreak} Days
        </p>
        <p className="text-muted-foreground">
          Keep going! Your best streak is{' '}
          <span className="font-semibold" data-testid="text-best-streak">
            {Math.max(userStats?.bestStreak || 0, currentStreak)} days
          </span>
        </p>
        {userStats && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Prayers</p>
              <p className="font-semibold text-primary">{userStats.totalPrayers || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">On-Time Prayers</p>
              <p className="font-semibold text-green-600">{userStats.onTimePrayers || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Achievement Cards Grid */}
      {achievements.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <AchievementCard 
              key={achievement.id} 
              achievement={achievement} 
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-achievements">
            No Achievements Yet
          </h3>
          <p className="text-muted-foreground">
            Complete your first perfect week to unlock your first achievement!
          </p>
        </div>
      )}

      {/* Milestone Progress */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-milestones-title">
          Milestones
        </h3>
        {isLoading || contextLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-48"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                    <div className="w-20 h-2 bg-muted rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <MilestoneProgress
                key={milestone.title}
                title={milestone.title}
                description={milestone.description}
                current={milestone.current}
                target={milestone.target}
                icon={milestone.icon}
                color={milestone.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
