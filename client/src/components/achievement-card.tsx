import { Trophy, Star, Medal, Calendar, Flame, Target, CheckCircle, Award, Crown, Zap, Moon, Sun, Shield, RotateCcw, CalendarDays } from 'lucide-react';
import { Achievement } from '@shared/schema';
import { cn } from '@/lib/utils';

// Helper function to convert background color to text color
function getTextColorFromBg(bgColor: string): string {
  const colorMap: { [key: string]: string } = {
    'bg-primary': 'text-primary',
    'bg-secondary': 'text-secondary',
    'bg-accent': 'text-accent',
    'bg-orange-500': 'text-orange-600',
    'bg-yellow-500': 'text-yellow-600',
    'bg-green-500': 'text-green-600',
    'bg-blue-500': 'text-blue-600',
    'bg-purple-500': 'text-purple-600',
    'bg-pink-500': 'text-pink-600',
    'bg-red-500': 'text-red-600',
    'bg-indigo-500': 'text-indigo-600',
    'bg-teal-500': 'text-teal-600',
  };
  return colorMap[bgColor] || 'text-primary';
}

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
}

const achievementIcons = {
  perfect_day: CheckCircle,
  perfect_week: Trophy,
  perfect_month: Medal,
  streak_milestone: Flame,
  prayer_milestone: Target,
  consistency: Calendar,
  early_bird: Star,
  night_owl: Moon,
  golden_hour: Sun,
  weekend_warrior: Shield,
  dedication: Crown,
  comeback: RotateCcw,
  monthly_champion: CalendarDays,
  special: Award,
  seasonal: Zap,
};

const achievementGradients = {
  perfect_day: 'from-green-400 to-green-600',
  perfect_week: 'from-blue-400 to-blue-600', 
  perfect_month: 'from-purple-400 to-purple-600',
  streak_milestone: 'from-orange-400 to-red-500',
  prayer_milestone: 'from-yellow-400 to-yellow-600',
  consistency: 'from-teal-400 to-teal-600',
  early_bird: 'from-pink-400 to-pink-600',
  night_owl: 'from-slate-400 to-slate-600',
  golden_hour: 'from-amber-400 to-orange-500',
  weekend_warrior: 'from-cyan-400 to-cyan-600',
  dedication: 'from-indigo-400 to-indigo-600',
  comeback: 'from-lime-400 to-green-500',
  monthly_champion: 'from-violet-400 to-purple-500',
  special: 'from-amber-400 to-amber-600',
  seasonal: 'from-emerald-400 to-emerald-600',
  default: 'from-primary to-accent'
};

export function AchievementCard({ achievement, index }: AchievementCardProps) {
  const Icon = achievementIcons[achievement.type as keyof typeof achievementIcons] || Trophy;
  const gradient = achievementGradients[achievement.type as keyof typeof achievementGradients] || achievementGradients.default;

  return (
    <div 
      className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid={`achievement-card-${index}`}
    >
      <div className="text-center mb-4">
        <div className={cn(
          "w-16 h-16 bg-gradient-to-br rounded-full flex items-center justify-center mx-auto mb-3",
          gradient
        )}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h4 className="font-semibold text-foreground" data-testid={`achievement-title-${index}`}>
          {achievement.title}
        </h4>
        <p className="text-sm text-muted-foreground" data-testid={`achievement-description-${index}`}>
          {achievement.description}
        </p>
      </div>
      <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
        <p data-testid={`achievement-date-${index}`}>
          <strong>Date:</strong> {new Date(achievement.earnedDate).toLocaleDateString()}
        </p>
        {achievement.metadata?.weekNumber && achievement.metadata?.year && (
          <p data-testid={`achievement-week-${index}`}>
            <strong>Week:</strong> {achievement.metadata.weekNumber} of {achievement.metadata.year}
          </p>
        )}
        {achievement.metadata?.streakDays && (
          <p data-testid={`achievement-streak-${index}`}>
            <strong>Streak:</strong> {achievement.metadata.streakDays} days
          </p>
        )}
        {achievement.metadata?.totalPrayers && (
          <p data-testid={`achievement-prayers-${index}`}>
            <strong>Prayers:</strong> {achievement.metadata.totalPrayers} completed
          </p>
        )}
        {achievement.metadata?.consistencyRate && (
          <p data-testid={`achievement-consistency-${index}`}>
            <strong>Rate:</strong> {achievement.metadata.consistencyRate}%
          </p>
        )}
        {achievement.metadata?.onTimePrayers !== undefined && (
          <p data-testid={`achievement-ontime-${index}`}>
            <strong>On-time:</strong> {achievement.metadata.onTimePrayers} prayers
          </p>
        )}
        {achievement.metadata?.period && (
          <p data-testid={`achievement-period-${index}`}>
            <strong>Period:</strong> {achievement.metadata.period}
          </p>
        )}
        {achievement.metadata?.consecutiveDays && (
          <p data-testid={`achievement-consecutive-${index}`}>
            <strong>Consecutive:</strong> {achievement.metadata.consecutiveDays} days
          </p>
        )}
        {achievement.metadata?.prayerType && (
          <p data-testid={`achievement-prayer-type-${index}`}>
            <strong>Prayer:</strong> {achievement.metadata.prayerType.charAt(0).toUpperCase() + achievement.metadata.prayerType.slice(1)}
          </p>
        )}
        {achievement.metadata?.perfectWeekends && (
          <p data-testid={`achievement-weekends-${index}`}>
            <strong>Perfect Weekends:</strong> {achievement.metadata.perfectWeekends}
          </p>
        )}
        {achievement.metadata?.consecutiveWeekends && (
          <p data-testid={`achievement-consecutive-weekends-${index}`}>
            <strong>Consecutive Weekends:</strong> {achievement.metadata.consecutiveWeekends}
          </p>
        )}
        {achievement.metadata?.comebackDays && (
          <p data-testid={`achievement-comeback-${index}`}>
            <strong>Comeback:</strong> {achievement.metadata.comebackDays} days
          </p>
        )}
        {achievement.metadata?.perfectMonths && (
          <p data-testid={`achievement-perfect-months-${index}`}>
            <strong>Perfect Months:</strong> {achievement.metadata.perfectMonths}
          </p>
        )}
        {achievement.metadata?.specialMonth && (
          <p data-testid={`achievement-special-month-${index}`}>
            <strong>Special Month:</strong> {achievement.metadata.specialMonth}
          </p>
        )}
      </div>
    </div>
  );
}

interface MilestoneProgressProps {
  title: string;
  description: string;
  current: number;
  target: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function MilestoneProgress({ title, description, current, target, icon: Icon, color }: MilestoneProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="flex items-center justify-between" data-testid={`milestone-${title.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-medium" data-testid={`milestone-title-${title.toLowerCase().replace(' ', '-')}`}>
            {title}
          </p>
          <p className="text-sm text-muted-foreground" data-testid={`milestone-description-${title.toLowerCase().replace(' ', '-')}`}>
            {description}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-medium", getTextColorFromBg(color))} data-testid={`milestone-progress-${title.toLowerCase().replace(' ', '-')}`}>
          {current}/{target}
        </p>
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-300", color)}
            style={{ width: `${percentage}%` }}
            data-testid={`milestone-bar-${title.toLowerCase().replace(' ', '-')}`}
          />
        </div>
      </div>
    </div>
  );
}
