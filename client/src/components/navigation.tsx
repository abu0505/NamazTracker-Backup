import { Link, useLocation } from 'wouter';
import { Home, Trophy, BarChart3, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/qaza', icon: Calendar, label: 'Qaza' },
  { path: '/achievements', icon: Trophy, label: 'Achievements' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="glass-nav fixed bottom-4 left-4 right-4 z-50 rounded-2xl p-2" data-testid="nav-bottom">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <button
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-300 relative",
                location === item.path
                  ? "bg-primary/20 text-black dark:text-primary-foreground backdrop-blur-md border border-primary/30 shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-white/10 hover:backdrop-blur-sm hover:border hover:border-white/20 dark:hover:bg-white/5"
              )}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
