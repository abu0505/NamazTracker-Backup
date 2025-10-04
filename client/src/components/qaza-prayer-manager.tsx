import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Save, X, Sun, Cloud, Star, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService, convertPrayerRecordToDailyPrayers } from '@/lib/api-service';
import { prayerNames, getPastWeeks, getWeeksFromJanuary, getPastMonthsFromJanuary, calculateWeekCompletion, calculateMonthCompletion, isWeekInFuture } from '@/lib/prayer-utils';
import { PrayerType, PrayerRecord } from '@shared/schema';
import { DailyPrayers } from '@/contexts/prayer-context';
import { apiRequest } from '@/lib/queryClient';
import { createAuthAwareQuery } from '@/lib/authUtils';

const prayerIcons = {
  fajr: Sun,
  dhuhr: Sun,
  asr: Cloud,
  maghrib: Star,
  isha: Star,
};

const prayerColors = {
  fajr: 'bg-primary/10 text-primary',
  dhuhr: 'bg-secondary/10 text-secondary',
  asr: 'bg-accent/10 text-accent',
  maghrib: 'bg-destructive/10 text-destructive',
  isha: 'bg-primary/10 text-primary',
};

const defaultPrayers: DailyPrayers = {
  fajr: { completed: false, onTime: false },
  dhuhr: { completed: false, onTime: false },
  asr: { completed: false, onTime: false },
  maghrib: { completed: false, onTime: false },
  isha: { completed: false, onTime: false },
};

export function QazaPrayerManager() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  
  // Daily view state
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [editedPrayers, setEditedPrayers] = useState<DailyPrayers>(defaultPrayers);
  const [originalPrayers, setOriginalPrayers] = useState<DailyPrayers>(defaultPrayers);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Weekly view state
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [isMarkingAsCompleted, setIsMarkingAsCompleted] = useState(true);
  const [weeklyHasChanges, setWeeklyHasChanges] = useState(false);
  const [pastWeeks, setPastWeeks] = useState<Array<{
    startDate: string;
    endDate: string;
    dates: string[];
    weekLabel: string;
  }>>([]);
  
  // Monthly view state
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [isMonthMarkingAsCompleted, setIsMonthMarkingAsCompleted] = useState(true);
  const [monthlyHasChanges, setMonthlyHasChanges] = useState(false);
  const [pastMonths, setPastMonths] = useState<Array<{
    startDate: string;
    endDate: string;
    dates: string[];
    monthLabel: string;
    monthName: string;
    year: number;
  }>>([]);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<{
    weekCount: number;
    dateCount: number;
    prayerCount: number;
    action: 'completed' | 'missed';
    dateRange: { start: string; end: string };
  } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Fetch prayer data for selected date
  const { data: prayerRecord, isLoading: isLoadingPrayers, refetch } = useQuery<PrayerRecord | null>({
    queryKey: ['/api/prayers', selectedDateString],
    queryFn: createAuthAwareQuery(() => apiService.getPrayerRecord(selectedDateString)),
    enabled: !!selectedDateString,
    staleTime: 0, // Always refetch to get latest data
  });

  // Save prayer changes mutation (daily)
  const savePrayersMutation = useMutation({
    mutationFn: async (data: { date: string; prayers: DailyPrayers }) => {
      const response = await apiRequest('POST', '/api/prayers', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Changes Saved! ✅",
        description: "Prayer record has been updated successfully.",
      });
      
      // Invalidate and refetch relevant queries for cache consistency
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/yearly-qaza'] });
      
      // Invalidate analytics queries for all periods to ensure real-time sync
      ['week', 'month', 'year'].forEach(period => {
        queryClient.invalidateQueries({ queryKey: ['/analytics/trend', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/data', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/summary', period] });
      });
      
      // Update original prayers to reflect saved state
      setOriginalPrayers(editedPrayers);
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to save prayer record:', error);
      toast({
        title: "Save Failed ❌",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Batch update mutation (weekly)
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ date: string; prayers: DailyPrayers }>) => {
      return await apiService.batchUpdatePrayerRecords(updates);
    },
    onSuccess: (data, variables) => {
      const weekCount = selectedWeeks.size;
      const prayerCount = variables.length;
      const action = isMarkingAsCompleted ? 'completed' : 'missed';
      
      toast({
        title: "Batch Update Successful! ✅",
        description: `${weekCount} week(s) with ${prayerCount} prayer records marked as ${action}.`,
      });
      
      // Invalidate and refetch relevant queries for cache consistency
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/yearly-qaza'] });
      
      // Invalidate analytics queries for all periods to ensure real-time sync
      ['week', 'month', 'year'].forEach(period => {
        queryClient.invalidateQueries({ queryKey: ['/analytics/trend', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/data', period] });
        queryClient.invalidateQueries({ queryKey: ['/analytics/summary', period] });
      });
      
      // Reset weekly selections
      setSelectedWeeks(new Set());
      setWeeklyHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to batch update prayer records:', error);
      toast({
        title: "Batch Update Failed ❌",
        description: "Failed to update prayer records. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update prayers when data is fetched
  useEffect(() => {
    if (prayerRecord) {
      const prayers = convertPrayerRecordToDailyPrayers(prayerRecord);
      if (prayers) {
        setEditedPrayers(prayers);
        setOriginalPrayers(prayers);
        setHasChanges(false);
      }
    } else if (selectedDateString) {
      // No data for this date, use default prayers
      setEditedPrayers(defaultPrayers);
      setOriginalPrayers(defaultPrayers);
      setHasChanges(false);
    }
  }, [prayerRecord, selectedDateString]);

  // Load past weeks and months when component mounts
  useEffect(() => {
    const weeks = getWeeksFromJanuary(); // Get weeks from January 1st to current
    setPastWeeks(weeks);
    
    const months = getPastMonthsFromJanuary(); // Get months from January to current (excluding current)
    setPastMonths(months);
  }, []);

  // Check if prayers have changed from original
  useEffect(() => {
    const changed = Object.keys(editedPrayers).some(prayer => {
      const prayerKey = prayer as PrayerType;
      return editedPrayers[prayerKey].completed !== originalPrayers[prayerKey].completed;
    });
    setHasChanges(changed);
  }, [editedPrayers, originalPrayers]);

  // Check if weekly selections have changed
  useEffect(() => {
    setWeeklyHasChanges(selectedWeeks.size > 0);
  }, [selectedWeeks]);
  
  // Check if monthly selections have changed
  useEffect(() => {
    setMonthlyHasChanges(selectedMonths.size > 0);
  }, [selectedMonths]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && date <= new Date()) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  const togglePrayer = (prayer: PrayerType) => {
    const currentTime = new Date().toISOString();
    setEditedPrayers(prev => ({
      ...prev,
      [prayer]: {
        ...prev[prayer],
        completed: !prev[prayer].completed,
        completedAt: !prev[prayer].completed ? currentTime : undefined,
      }
    }));
  };

  const handleSave = () => {
    if (!selectedDateString) return;
    
    savePrayersMutation.mutate({
      date: selectedDateString,
      prayers: editedPrayers,
    });
  };

  const handleCancel = () => {
    setEditedPrayers(originalPrayers);
    setHasChanges(false);
  };

  // Weekly handlers
  const toggleWeekSelection = (weekKey: string) => {
    const newSelected = new Set(selectedWeeks);
    if (newSelected.has(weekKey)) {
      newSelected.delete(weekKey);
    } else {
      newSelected.add(weekKey);
    }
    setSelectedWeeks(newSelected);
  };

  const selectAllWeeks = () => {
    const allWeekKeys = pastWeeks.map(week => `${week.startDate}-${week.endDate}`);
    setSelectedWeeks(new Set(allWeekKeys));
  };

  const clearWeekSelection = () => {
    setSelectedWeeks(new Set());
  };

  const handleBatchUpdate = () => {
    // Check if either weeks or months are selected
    if (selectedWeeks.size === 0 && selectedMonths.size === 0) return;

    // Calculate batch update details
    const updates: Array<{ date: string; prayers: DailyPrayers }> = [];
    let earliestDate: string | null = null;
    let latestDate: string | null = null;
    
    // Handle weekly updates
    if (selectedWeeks.size > 0) {
      selectedWeeks.forEach(weekKey => {
        const week = pastWeeks.find(w => `${w.startDate}-${w.endDate}` === weekKey);
        if (week) {
          week.dates.forEach(date => {
            if (!earliestDate || date < earliestDate) earliestDate = date;
            if (!latestDate || date > latestDate) latestDate = date;
            
            const prayers: DailyPrayers = {
              fajr: { completed: isMarkingAsCompleted, onTime: false },
              dhuhr: { completed: isMarkingAsCompleted, onTime: false },
              asr: { completed: isMarkingAsCompleted, onTime: false },
              maghrib: { completed: isMarkingAsCompleted, onTime: false },
              isha: { completed: isMarkingAsCompleted, onTime: false },
            };
            updates.push({ date, prayers });
          });
        }
      });
    }

    // Handle monthly updates
    if (selectedMonths.size > 0) {
      selectedMonths.forEach(monthKey => {
        const month = pastMonths.find(m => `${m.monthName}-${m.year}` === monthKey);
        if (month) {
          month.dates.forEach(date => {
            if (!earliestDate || date < earliestDate) earliestDate = date;
            if (!latestDate || date > latestDate) latestDate = date;
            
            const prayers: DailyPrayers = {
              fajr: { completed: isMonthMarkingAsCompleted, onTime: false },
              dhuhr: { completed: isMonthMarkingAsCompleted, onTime: false },
              asr: { completed: isMonthMarkingAsCompleted, onTime: false },
              maghrib: { completed: isMonthMarkingAsCompleted, onTime: false },
              isha: { completed: isMonthMarkingAsCompleted, onTime: false },
            };
            updates.push({ date, prayers });
          });
        }
      });
    }

    // Set confirmation details and show dialog
    const weekCount = selectedWeeks.size;
    const action = selectedWeeks.size > 0 
      ? (isMarkingAsCompleted ? 'completed' : 'missed')
      : (isMonthMarkingAsCompleted ? 'completed' : 'missed');

    setConfirmationDetails({
      weekCount: weekCount,
      dateCount: updates.length,
      prayerCount: updates.length * 5, // 5 prayers per day
      action: action,
      dateRange: { 
        start: earliestDate || '', 
        end: latestDate || '' 
      }
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmBatchUpdate = async () => {
    if (selectedWeeks.size === 0 && selectedMonths.size === 0) return;

    const updates: Array<{ date: string; prayers: DailyPrayers }> = [];
    
    // Handle weekly updates
    if (selectedWeeks.size > 0) {
      selectedWeeks.forEach(weekKey => {
        const week = pastWeeks.find(w => `${w.startDate}-${w.endDate}` === weekKey);
        if (week) {
          week.dates.forEach(date => {
            const prayers: DailyPrayers = {
              fajr: { completed: isMarkingAsCompleted, onTime: false },
              dhuhr: { completed: isMarkingAsCompleted, onTime: false },
              asr: { completed: isMarkingAsCompleted, onTime: false },
              maghrib: { completed: isMarkingAsCompleted, onTime: false },
              isha: { completed: isMarkingAsCompleted, onTime: false },
            };
            updates.push({ date, prayers });
          });
        }
      });
    }
    
    // Handle monthly updates
    if (selectedMonths.size > 0) {
      selectedMonths.forEach(monthKey => {
        const month = pastMonths.find(m => `${m.monthName}-${m.year}` === monthKey);
        if (month) {
          month.dates.forEach(date => {
            const prayers: DailyPrayers = {
              fajr: { completed: isMonthMarkingAsCompleted, onTime: false },
              dhuhr: { completed: isMonthMarkingAsCompleted, onTime: false },
              asr: { completed: isMonthMarkingAsCompleted, onTime: false },
              maghrib: { completed: isMonthMarkingAsCompleted, onTime: false },
              isha: { completed: isMonthMarkingAsCompleted, onTime: false },
            };
            updates.push({ date, prayers });
          });
        }
      });
    }

    setShowConfirmDialog(false);
    
    // Split updates into batches of 7 (API limit) and send sequentially
    const batchSize = 7;
    const batches = [];
    for (let i = 0; i < updates.length; i += batchSize) {
      batches.push(updates.slice(i, i + batchSize));
    }
    
    try {
      // Send all batches sequentially
      for (const batch of batches) {
        await batchUpdateMutation.mutateAsync(batch);
      }
      
      // Clear selections after successful batch updates
      setSelectedWeeks(new Set());
      setSelectedMonths(new Set());
      setWeeklyHasChanges(false);
      setMonthlyHasChanges(false);
      
      toast({
        title: "Prayers Updated Successfully",
        description: `Updated ${updates.length} day(s) across ${batches.length} batch(es)`,
      });
      
    } catch (error) {
      console.error('Batch update failed:', error);
      toast({
        title: "Batch Update Failed",
        description: "Failed to update prayer records. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWeeklyCancelChanges = () => {
    setSelectedWeeks(new Set());
    setWeeklyHasChanges(false);
  };

  // Monthly handlers
  const toggleMonthSelection = (monthKey: string) => {
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(monthKey)) {
      newSelected.delete(monthKey);
    } else {
      newSelected.add(monthKey);
    }
    setSelectedMonths(newSelected);
  };

  const selectAllMonths = () => {
    const allMonthKeys = pastMonths.map(month => `${month.monthName}-${month.year}`);
    setSelectedMonths(new Set(allMonthKeys));
  };

  const clearMonthSelection = () => {
    setSelectedMonths(new Set());
  };

  const handleMonthlyBatchUpdate = () => {
    if (selectedMonths.size === 0) return;

    // Calculate batch update details for months
    const updates: Array<{ date: string; prayers: DailyPrayers }> = [];
    let earliestDate: string | null = null;
    let latestDate: string | null = null;
    
    selectedMonths.forEach(monthKey => {
      const month = pastMonths.find(m => `${m.monthName}-${m.year}` === monthKey);
      if (month) {
        month.dates.forEach(date => {
          if (!earliestDate || date < earliestDate) earliestDate = date;
          if (!latestDate || date > latestDate) latestDate = date;
          
          const prayers: DailyPrayers = {
            fajr: { completed: isMonthMarkingAsCompleted, onTime: false },
            dhuhr: { completed: isMonthMarkingAsCompleted, onTime: false },
            asr: { completed: isMonthMarkingAsCompleted, onTime: false },
            maghrib: { completed: isMonthMarkingAsCompleted, onTime: false },
            isha: { completed: isMonthMarkingAsCompleted, onTime: false },
          };
          updates.push({ date, prayers });
        });
      }
    });

    // Set confirmation details and show dialog
    setConfirmationDetails({
      weekCount: selectedMonths.size,
      dateCount: updates.length,
      prayerCount: updates.length * 5, // 5 prayers per day
      action: isMonthMarkingAsCompleted ? 'completed' : 'missed',
      dateRange: { 
        start: earliestDate || '', 
        end: latestDate || '' 
      }
    });
    setShowConfirmDialog(true);
  };

  const handleMonthlyCancelChanges = () => {
    setSelectedMonths(new Set());
    setMonthlyHasChanges(false);
  };

  const isPastDate = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-qaza-title">
          Qaza Prayer Management
        </h2>
        <p className="text-muted-foreground" data-testid="text-qaza-description">
          Manage your missed prayers individually by date or in bulk by week
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "daily" | "weekly" | "monthly")} className="w-full">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-view-selector">
          <TabsTrigger value="daily" data-testid="tab-daily">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Daily View
          </TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">
            <Clock className="mr-2 h-4 w-4" />
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Monthly View
          </TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily" className="space-y-6" data-testid="content-daily-view">

      {/* Date Picker */}
      <div className="flex justify-center">
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal glass-card",
                !selectedDate && "text-muted-foreground"
              )}
              data-testid="button-date-picker"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" data-testid="popover-calendar">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
              initialFocus
              data-testid="calendar-date-picker"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Prayer Status Display */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold" data-testid="text-selected-date">
              Prayer Status for {format(selectedDate, "MMMM d, yyyy")}
            </h3>
          </div>

          {/* Loading State */}
          {isLoadingPrayers ? (
            <div className="animate-pulse space-y-4" data-testid="loading-prayers">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div>
                      <div className="w-16 h-4 bg-muted rounded"></div>
                      <div className="w-24 h-3 bg-muted/70 rounded mt-2"></div>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-muted rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            /* Prayer List */
            <div className="space-y-3">
              {Object.entries(editedPrayers).map(([prayer, status]) => {
                const prayerKey = prayer as PrayerType;
                const Icon = prayerIcons[prayerKey];
                
                return (
                  <div
                    key={prayer}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-muted/50",
                      status.completed ? "bg-primary/5" : "bg-muted/30"
                    )}
                    data-testid={`prayer-item-${prayer}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", prayerColors[prayerKey])}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground" data-testid={`text-prayer-name-${prayer}`}>
                          {prayerNames[prayerKey]}
                        </h4>
                        <p className="text-sm text-muted-foreground" data-testid={`text-prayer-status-${prayer}`}>
                          {status.completed ? 'Completed' : 'Missed'}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={status.completed}
                      onCheckedChange={() => togglePrayer(prayerKey)}
                      className="h-5 w-5"
                      data-testid={`checkbox-prayer-${prayer}`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          {selectedDate && !isLoadingPrayers && (
            <div className="flex justify-center gap-3 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={!hasChanges || savePrayersMutation.isPending}
                className="min-w-[100px]"
                data-testid="button-cancel"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || savePrayersMutation.isPending}
                className="min-w-[100px]"
                data-testid="button-save"
              >
                {savePrayersMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {savePrayersMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      )}

          {!selectedDate && (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg" data-testid="text-no-date-selected">
                Select a date to manage prayer records
              </p>
            </div>
          )}
        </TabsContent>

        {/* Weekly View */}
        <TabsContent value="weekly" className="space-y-6" data-testid="content-weekly-view">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2" data-testid="text-weekly-title">
              Bulk Prayer Management
            </h3>
            <p className="text-muted-foreground text-sm" data-testid="text-weekly-description">
              Select weeks to mark all prayers as completed or missed
            </p>
          </div>

          {/* Mark as Completed/Missed Toggle */}
          <div className="flex justify-center gap-4">
            <Button
              variant={isMarkingAsCompleted ? "default" : "outline"}
              onClick={() => {
                setIsMarkingAsCompleted(true);
                handleBatchUpdate();
              }}
              data-testid="button-mark-completed"
            >
              Mark as Completed
            </Button>
            <Button
              variant={!isMarkingAsCompleted ? "default" : "outline"}
              onClick={() => {
                setIsMarkingAsCompleted(false);
                handleBatchUpdate();
              }}
              data-testid="button-mark-missed"
            >
              Mark as Missed
            </Button>
          </div>

          {/* Week Selection Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllWeeks}
                disabled={pastWeeks.length === 0}
                data-testid="button-select-all-weeks"
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearWeekSelection}
                disabled={selectedWeeks.size === 0}
                data-testid="button-clear-selection"
              >
                Clear Selection
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-selected-count">
              {selectedWeeks.size} week(s) selected
            </p>
          </div>

          {/* Past Weeks List */}
          <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="list-past-weeks">
            {pastWeeks.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg" data-testid="text-no-weeks-available">
                  No past weeks available for selection
                </p>
              </div>
            ) : (
              pastWeeks.map((week) => {
                const weekKey = `${week.startDate}-${week.endDate}`;
                const isSelected = selectedWeeks.has(weekKey);
                
                return (
                  <WeekRow
                    key={weekKey}
                    week={week}
                    isSelected={isSelected}
                    onToggle={() => toggleWeekSelection(weekKey)}
                  />
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          {weeklyHasChanges && (
            <div className="flex justify-center gap-3 pt-4">
              <Button
                onClick={handleWeeklyCancelChanges}
                variant="outline"
                disabled={batchUpdateMutation.isPending}
                className="min-w-[100px]"
                data-testid="button-weekly-cancel"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleBatchUpdate}
                disabled={selectedWeeks.size === 0 || batchUpdateMutation.isPending}
                className="min-w-[140px]"
                data-testid="button-weekly-save"
              >
                {batchUpdateMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {batchUpdateMutation.isPending 
                  ? 'Processing...' 
                  : `Mark Selected Weeks`
                }
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Monthly View */}
        <TabsContent value="monthly" className="space-y-6" data-testid="content-monthly-view">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2" data-testid="text-monthly-title">
              Monthly Prayer Management
            </h3>
            <p className="text-muted-foreground text-sm" data-testid="text-monthly-description">
              Select months to mark all prayers as completed or missed
            </p>
          </div>

          {/* Mark as Completed/Missed Toggle */}
          <div className="flex justify-center gap-4">
            <Button
              variant={isMonthMarkingAsCompleted ? "default" : "outline"}
              onClick={() => {
                setIsMonthMarkingAsCompleted(true);
                handleBatchUpdate();
              }}
              data-testid="button-monthly-mark-completed"
            >
              Mark as Completed
            </Button>
            <Button
              variant={!isMonthMarkingAsCompleted ? "default" : "outline"}
              onClick={() => {
                setIsMonthMarkingAsCompleted(false);
                handleBatchUpdate();
              }}
              data-testid="button-monthly-mark-missed"
            >
              Mark as Missed
            </Button>
          </div>

          {/* Month Selection Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllMonths}
                disabled={pastMonths.length === 0}
                data-testid="button-select-all-months"
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearMonthSelection}
                disabled={selectedMonths.size === 0}
                data-testid="button-clear-monthly-selection"
              >
                Clear Selection
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-monthly-selected-count">
              {selectedMonths.size} month(s) selected
            </p>
          </div>

          {/* Past Months List */}
          <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="list-past-months">
            {pastMonths.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg" data-testid="text-no-months-available">
                  No past months available for selection
                </p>
              </div>
            ) : (
              pastMonths.map((month) => {
                const monthKey = `${month.monthName}-${month.year}`;
                const isSelected = selectedMonths.has(monthKey);
                
                return (
                  <MonthRow
                    key={monthKey}
                    month={month}
                    isSelected={isSelected}
                    onToggle={() => toggleMonthSelection(monthKey)}
                  />
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          {monthlyHasChanges && (
            <div className="flex justify-center gap-3 pt-4">
              <Button
                onClick={handleMonthlyCancelChanges}
                variant="outline"
                disabled={batchUpdateMutation.isPending}
                className="min-w-[100px]"
                data-testid="button-monthly-cancel"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleMonthlyBatchUpdate}
                disabled={selectedMonths.size === 0 || batchUpdateMutation.isPending}
                className="min-w-[140px]"
                data-testid="button-monthly-save"
              >
                {batchUpdateMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {batchUpdateMutation.isPending 
                  ? 'Processing...' 
                  : `Mark Selected Months`
                }
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-testid="dialog-batch-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-confirmation-title">
              Confirm Batch Update
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-confirmation-description">
              {confirmationDetails && (
                <div className="space-y-3">
                  <p className="text-destructive font-medium">
                    ⚠️ This action will overwrite any existing prayer records for the selected dates
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Action:</strong> Mark as{" "}
                      <span className={cn(
                        "font-semibold",
                        confirmationDetails.action === 'completed' ? "text-green-600" : "text-orange-600"
                      )}>
                        {confirmationDetails.action}
                      </span>
                    </p>
                    <p>
                      <strong>Affected weeks:</strong> {confirmationDetails.weekCount} week(s)
                    </p>
                    <p>
                      <strong>Date range:</strong> {confirmationDetails.dateRange.start} to {confirmationDetails.dateRange.end}
                    </p>
                    <p>
                      <strong>Total prayers:</strong> {confirmationDetails.prayerCount} prayers across {confirmationDetails.dateCount} days
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This cannot be undone. All individual daily prayer settings for these dates will be replaced.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowConfirmDialog(false)}
              data-testid="button-confirmation-cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBatchUpdate}
              disabled={batchUpdateMutation.isPending}
              data-testid="button-confirmation-proceed"
              className={cn(
                confirmationDetails?.action === 'completed' 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-orange-600 hover:bg-orange-700"
              )}
            >
              {batchUpdateMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                `Yes, Mark as ${confirmationDetails?.action || 'completed'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Week Row Component for displaying individual weeks
function WeekRow({ 
  week, 
  isSelected, 
  onToggle 
}: { 
  week: { startDate: string; endDate: string; dates: string[]; weekLabel: string }; 
  isSelected: boolean; 
  onToggle: () => void; 
}) {
  const [completion, setCompletion] = useState<{
    completionPercentage: number;
    status: 'empty' | 'partial' | 'complete';
  }>({ completionPercentage: 0, status: 'empty' });
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if this week is in the future and should be disabled
  const isDisabled = isWeekInFuture(week.endDate);

  useEffect(() => {
    const fetchCompletion = async () => {
      setIsLoading(true);
      try {
        const result = await calculateWeekCompletion(week.dates);
        setCompletion({
          completionPercentage: result.completionPercentage,
          status: result.status,
        });
      } catch (error) {
        console.error('Error fetching week completion:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletion();
  }, [week.dates]);

  const getStatusIndicator = () => {
    if (isLoading) {
      return <div className="w-3 h-3 rounded-full bg-muted animate-pulse"></div>;
    }
    
    switch (completion.status) {
      case 'complete':
        return <div className="w-3 h-3 rounded-full bg-green-500"></div>;
      case 'partial':
        return <div className="w-3 h-3 rounded-full bg-yellow-500"></div>;
      case 'empty':
        return <div className="w-3 h-3 rounded-full bg-red-500"></div>;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl transition-all duration-300",
        isDisabled 
          ? "opacity-50 cursor-not-allowed bg-muted/20" 
          : "hover:bg-muted/50 cursor-pointer",
        isSelected && !isDisabled ? "bg-primary/10 border border-primary/20" : "bg-muted/30"
      )}
      onClick={isDisabled ? undefined : onToggle}
      data-testid={`week-row-${week.startDate}`}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={isSelected && !isDisabled}
          onCheckedChange={isDisabled ? undefined : onToggle}
          disabled={isDisabled}
          className="h-5 w-5"
          data-testid={`checkbox-week-${week.startDate}`}
        />
        <div className="flex items-center gap-3">
          {getStatusIndicator()}
          <div>
            <h4 className={cn(
              "font-medium",
              isDisabled ? "text-muted-foreground" : "text-foreground"
            )} data-testid={`text-week-label-${week.startDate}`}>
              {week.weekLabel}
              {isDisabled && <span className="ml-2 text-xs">(Future)</span>}
            </h4>
            <p className="text-sm text-muted-foreground" data-testid={`text-week-completion-${week.startDate}`}>
              {isDisabled 
                ? 'Not available (future week)'
                : isLoading 
                  ? 'Loading...' 
                  : `${completion.completionPercentage}% completed`
              }
            </p>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {week.dates.length} days
      </div>
    </div>
  );
}

// Month Row Component for displaying individual months
function MonthRow({ 
  month, 
  isSelected, 
  onToggle 
}: { 
  month: { 
    startDate: string; 
    endDate: string; 
    dates: string[]; 
    monthLabel: string;
    monthName: string;
    year: number;
  }; 
  isSelected: boolean; 
  onToggle: () => void; 
}) {
  const [completion, setCompletion] = useState<{
    completionPercentage: number;
    status: 'empty' | 'partial' | 'complete';
  }>({ completionPercentage: 0, status: 'empty' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletion = async () => {
      setIsLoading(true);
      try {
        const result = await calculateMonthCompletion(month.dates);
        setCompletion({
          completionPercentage: result.completionPercentage,
          status: result.status,
        });
      } catch (error) {
        console.error('Error fetching month completion:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletion();
  }, [month.dates]);

  const getStatusIndicator = () => {
    if (isLoading) {
      return <div className="w-3 h-3 rounded-full bg-muted animate-pulse"></div>;
    }
    
    switch (completion.status) {
      case 'complete':
        return <div className="w-3 h-3 rounded-full bg-green-500"></div>;
      case 'partial':
        return <div className="w-3 h-3 rounded-full bg-yellow-500"></div>;
      case 'empty':
        return <div className="w-3 h-3 rounded-full bg-red-500"></div>;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-muted/50 cursor-pointer",
        isSelected ? "bg-primary/10 border border-primary/20" : "bg-muted/30"
      )}
      onClick={onToggle}
      data-testid={`month-row-${month.monthName}-${month.year}`}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className="h-5 w-5"
          data-testid={`checkbox-month-${month.monthName}-${month.year}`}
        />
        <div className="flex items-center gap-3">
          {getStatusIndicator()}
          <div>
            <h4 className="font-medium text-foreground" data-testid={`text-month-label-${month.monthName}-${month.year}`}>
              {month.monthLabel}
            </h4>
            <p className="text-sm text-muted-foreground" data-testid={`text-month-completion-${month.monthName}-${month.year}`}>
              {isLoading 
                ? 'Loading...' 
                : `${completion.completionPercentage}% completed`
              }
            </p>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {month.dates.length} days
      </div>
    </div>
  );
}