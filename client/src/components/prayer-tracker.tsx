import { Bell } from 'lucide-react';
import { usePrayer } from '../contexts/prayer-context';
import { prayerNames, prayerTimes, prayerIcons } from '../lib/prayer-utils';
import { PrayerType } from '@shared/schema';
import { cn } from '@/lib/utils';

export function PrayerTracker() {
  const { todayPrayers, togglePrayer, isLoading } = usePrayer();

  const handleNotificationClick = (prayer: PrayerType, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Notification clicked for', prayer);
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-muted rounded-full"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-6 bg-muted rounded"></div>
                <div className="w-6 h-6 bg-muted rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="space-y-3">
        {Object.entries(todayPrayers).map(([prayer, status]) => {
          const prayerKey = prayer as PrayerType;
          
          return (
            <div
              key={prayer}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-muted/50",
                status.completed ? "bg-primary/5" : "bg-muted/30"
              )}
              data-testid={`prayer-item-${prayer}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={status.completed}
                  onChange={() => togglePrayer(prayerKey)}
                  className="prayer-checkbox cursor-pointer"
                  data-testid={`checkbox-prayer-${prayer}`}
                />
                
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => togglePrayer(prayerKey)}
                >
                  <span className="text-2xl" data-testid={`emoji-prayer-${prayer}`}>
                    {prayerIcons[prayerKey]}
                  </span>
                  <h4 className="font-semibold text-foreground" data-testid={`text-prayer-name-${prayer}`}>
                    {prayerNames[prayerKey]}
                  </h4>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-xl font-semibold text-foreground" data-testid={`text-prayer-time-${prayer}`}>
                  {prayerTimes[prayerKey]}
                </div>
                
                <button
                  onClick={(e) => handleNotificationClick(prayerKey, e)}
                  className="p-2 hover:bg-muted/30 rounded-full transition-colors"
                  data-testid={`button-notification-${prayer}`}
                  aria-label={`Set notification for ${prayerNames[prayerKey]}`}
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
