import { AnalyticsCharts } from '../components/analytics-charts';

export default function Analytics() {
  return (
    <div className="space-y-6" data-testid="page-analytics">
      <h2 className="text-2xl font-bold text-center" data-testid="text-analytics-title">
        Analytics
      </h2>
      <AnalyticsCharts />
    </div>
  );
}
