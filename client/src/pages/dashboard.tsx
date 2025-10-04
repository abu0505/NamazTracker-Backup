import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PrayerTracker } from '../components/prayer-tracker';
import { WeeklyProgress, WeeklyOverview } from '../components/weekly-progress';
import { 
  getHijriDate, 
  formatDateForDisplay, 
  getCurrentPrayer, 
  getNextPrayer,
  getCurrentTime
} from '../lib/prayer-utils';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [nextPrayer, setNextPrayer] = useState(getNextPrayer());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setNextPrayer(getNextPrayer());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentPrayer = getCurrentPrayer();
  const hijriDate = getHijriDate(selectedDate);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      {/* Calendar Date Display */}
      <div className="glass-card rounded-2xl p-6" data-testid="calendar-date-display">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-muted/20 rounded-full transition-colors"
            data-testid="button-prev-date"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-current-date">
              {isToday ? 'Today' : ''}{isToday ? ', ' : ''}{formatDateForDisplay(selectedDate)}
            </h2>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-hijri-date">
              {hijriDate}
            </p>
          </div>

          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-muted/20 rounded-full transition-colors"
            data-testid="button-next-date"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Current Prayer Time Card */}
      {currentPrayer && (
        <div className="glass-card rounded-2xl p-6" data-testid="current-prayer-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold" data-testid="badge-now">
                Now
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl" data-testid="emoji-current-prayer">{currentPrayer.emoji}</span>
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-current-prayer-name">
                    {currentPrayer.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-next-prayer-countdown">
                  {nextPrayer.name} in {nextPrayer.countdown}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-bold text-primary" data-testid="text-current-time">
                {currentTime}
              </div>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-6 text-center" data-testid="text-page-title">
          Today's Prayers
        </h2>
        <PrayerTracker />
      </section>

      <WeeklyProgress />
      <WeeklyOverview />
    </div>
  );
}
