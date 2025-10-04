import { QazaPrayerManager } from '../components/qaza-prayer-manager';

export default function Qaza() {
  return (
    <div className="space-y-8" data-testid="page-qaza">
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center" data-testid="text-page-title">
          Qaza Prayer Management
        </h2>
        <p className="text-center text-muted-foreground mb-8" data-testid="text-page-description">
          Review and update your past prayer records to keep your spiritual journey accurate.
        </p>
        <QazaPrayerManager />
      </section>
    </div>
  );
}