import { useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { getTrendDataForPeriod, getAnalyticsDataForPeriod, getPeriodSummary } from '../lib/prayer-utils';
import { createAuthAwareQuery } from '../lib/authUtils';
import { apiService } from '../lib/api-service';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

export function AnalyticsCharts() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const timePeriods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Fetch trend data for the selected period
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['/analytics/trend', selectedPeriod],
    queryFn: createAuthAwareQuery(() => getTrendDataForPeriod(selectedPeriod)),
  });

  // Fetch analytics data for the selected period
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/analytics/data', selectedPeriod],
    queryFn: createAuthAwareQuery(() => getAnalyticsDataForPeriod(selectedPeriod)),
  });

  // Fetch summary statistics for the selected period
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['/analytics/summary', selectedPeriod],
    queryFn: createAuthAwareQuery(() => getPeriodSummary(selectedPeriod)),
  });

  // Fetch yearly Qaza statistics (independent of selected period)
  const { data: yearlyQazaData, isLoading: yearlyQazaLoading } = useQuery({
    queryKey: ['/api/stats/yearly-qaza'],
    queryFn: createAuthAwareQuery(() => apiService.getYearlyQazaStats()),
  });

  // Fetch user statistics for Qaza vs On-time prayer comparison
  const { data: userStatsData, isLoading: userStatsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: createAuthAwareQuery(() => apiService.getUserStats()),
  });

  const isLoading = trendLoading || analyticsLoading || summaryLoading || yearlyQazaLoading || userStatsLoading;

  // Main trend chart data
  const mainChartData = {
    labels: trendData?.labels || [],
    datasets: [
      {
        label: 'Completed Prayers',
        data: trendData?.dataPoints || [],
        borderColor: 'hsl(158, 70%, 20%)',
        backgroundColor: 'hsla(158, 70%, 20%, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        grid: {
          color: 'hsl(214.3, 31.8%, 91.4%)',
        },
      },
      x: {
        grid: {
          color: 'hsl(214.3, 31.8%, 91.4%)',
        },
      },
    },
  };

  // Prayer distribution chart data
  const distributionData = {
    labels: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    datasets: [
      {
        data: analyticsData ? Object.values(analyticsData).map(prayer => 
          prayer.total > 0 ? Math.round((prayer.completed / prayer.total) * 100) : 0
        ) : [0, 0, 0, 0, 0],
        backgroundColor: [
          'hsl(158, 70%, 20%)',
          'hsl(28, 80%, 45%)',
          'hsl(199, 89%, 48%)',
          'hsl(0, 84.2%, 60.2%)',
          'hsl(158, 60%, 30%)',
        ],
      },
    ],
  };

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Period comparison chart data (reuses trend data for consistency)
  const comparisonData = {
    labels: trendData?.labels || [],
    datasets: [
      {
        label: 'Prayers Completed',
        data: trendData?.dataPoints || [],
        backgroundColor: 'hsl(158, 70%, 20%)',
        borderRadius: 8,
      },
    ],
  };

  const comparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
      },
    },
  };

  // Qaza vs On-time prayer performance chart data
  const qazaPerformanceData = {
    labels: ['On-time Prayers', 'Qaza Prayers'],
    datasets: [
      {
        data: [
          userStatsData?.onTimePrayers || 0,
          userStatsData?.qazaPrayers || 0,
        ],
        backgroundColor: [
          'hsl(158, 70%, 50%)', // Green for on-time prayers
          'hsl(0, 84.2%, 60.2%)', // Red for Qaza prayers
        ],
        borderWidth: 2,
        borderColor: [
          'hsl(158, 70%, 40%)',
          'hsl(0, 84.2%, 50%)',
        ],
      },
    ],
  };

  const qazaPerformanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = (userStatsData?.onTimePrayers || 0) + (userStatsData?.qazaPrayers || 0);
            const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Statistics from summary data
  const totalPrayers = summaryData?.totalPrayers || 0;
  const totalPossible = summaryData?.totalPossible || 0;
  const successRate = summaryData?.successRate || 0;
  const totalQaza = summaryData?.qazaPrayers || 0;

  // Dynamic titles based on period
  const comparisonTitle = selectedPeriod === 'week' 
    ? 'Weekly Comparison' 
    : selectedPeriod === 'month' 
    ? 'Monthly Comparison' 
    : 'Yearly Comparison';

  const trendTitle = `Prayer Completion Trend (${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)})`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Time Period Selector */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex justify-center gap-2">
            {timePeriods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  selectedPeriod === period.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`period-${period.value}`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        <div className="glass-card rounded-2xl p-6">
          <div className="h-6 bg-muted rounded mb-4 w-48 animate-pulse"></div>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="h-6 bg-muted rounded mb-4 w-32 animate-pulse"></div>
            <div className="h-48 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="h-6 bg-muted rounded mb-4 w-32 animate-pulse"></div>
            <div className="h-48 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="h-6 bg-muted rounded mb-4 w-32 animate-pulse"></div>
            <div className="h-48 bg-muted rounded animate-pulse"></div>
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 text-center">
              <div className="h-8 bg-muted rounded mb-4 mx-auto w-8 animate-pulse"></div>
              <div className="h-6 bg-muted rounded mb-2 w-24 mx-auto animate-pulse"></div>
              <div className="h-8 bg-muted rounded mb-2 w-16 mx-auto animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex justify-center gap-2">
          {timePeriods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                selectedPeriod === period.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`period-${period.value}`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-prayer-completion-trend">
          {trendTitle}
        </h3>
        <div className="h-64">
          <Line data={mainChartData} options={mainChartOptions} />
        </div>
      </div>

      {/* Prayer-specific Charts */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4" data-testid="text-prayer-distribution">
            Prayer Distribution
          </h3>
          <div className="h-48">
            <Doughnut data={distributionData} options={distributionOptions} />
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4" data-testid="text-weekly-comparison">
            {comparisonTitle}
          </h3>
          <div className="h-48">
            <Bar data={comparisonData} options={comparisonOptions} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4" data-testid="text-qaza-performance">
            Prayer Performance
          </h3>
          <div className="h-48">
            <Doughnut data={qazaPerformanceData} options={qazaPerformanceOptions} />
          </div>
          <div className="mt-4 text-center space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">On-time:</span>
              <span className="font-semibold text-green-600" data-testid="text-ontime-count">
                {userStatsData?.onTimePrayers || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Qaza:</span>
              <span className="font-semibold text-red-600" data-testid="text-qaza-count">
                {userStatsData?.qazaPrayers || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span className="text-muted-foreground">Total:</span>
              <span data-testid="text-performance-total">
                {(userStatsData?.onTimePrayers || 0) + (userStatsData?.qazaPrayers || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">🤲</div>
          <h4 className="text-lg font-semibold mb-2" data-testid="text-total-prayers-title">
            Total Prayers
          </h4>
          <p className="text-2xl font-bold text-primary" data-testid="text-total-prayers">
            {totalPrayers}
          </p>
          <p className="text-sm text-muted-foreground">Since tracking started</p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">📊</div>
          <h4 className="text-lg font-semibold mb-2" data-testid="text-success-rate-title">
            Success Rate
          </h4>
          <p className="text-2xl font-bold text-secondary" data-testid="text-success-rate">
            {successRate}%
          </p>
          <p className="text-sm text-muted-foreground">Overall completion rate</p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">⏰</div>
          <h4 className="text-lg font-semibold mb-2" data-testid="text-qaza-prayers-title">
            Qaza Prayers
          </h4>
          <p className="text-2xl font-bold text-destructive" data-testid="text-total-qaza">
            {totalQaza}
          </p>
          <p className="text-sm text-muted-foreground">Need to be completed</p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">📅</div>
          <h4 className="text-lg font-semibold mb-2" data-testid="text-yearly-qaza-title">
            Remaining Qaza {yearlyQazaData?.currentYear || new Date().getFullYear()}
          </h4>
          <p className="text-2xl font-bold text-orange-600" data-testid="text-yearly-qaza-remaining">
            {yearlyQazaData?.qazaRemaining || 0}
          </p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground" data-testid="text-yearly-total-possible">
              {yearlyQazaData?.totalPossible || 0} total possible
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-yearly-completed">
              {yearlyQazaData?.completed || 0} completed
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-yearly-completion-percentage">
              {yearlyQazaData && yearlyQazaData.totalPossible > 0 
                ? Math.round((yearlyQazaData.completed / yearlyQazaData.totalPossible) * 100)
                : 0}% completion rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
