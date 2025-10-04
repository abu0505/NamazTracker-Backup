import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Calendar, Trophy, BarChart3, Clock, Zap, Star } from 'lucide-react';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Header */}
      <header className="glass-nav fixed top-0 left-0 right-0 z-50 px-4 py-3 m-4 rounded-2xl" data-testid="header-landing">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-lg">🕌</span>
            </div>
            <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
              Namaz Tracker
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              onClick={handleLogin}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-login-header"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-sm px-4 py-2" data-testid="badge-spiritual">
                ✨ Strengthen Your Spiritual Journey
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-hero-title">
                Track Your Daily Prayers
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-description">
                Never miss a prayer again. Build consistent habits, track your spiritual progress, and earn achievements along your journey.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg rounded-full shadow-lg"
                data-testid="button-login-hero"
              >
                Start Tracking Today
              </Button>
              <p className="text-sm text-muted-foreground" data-testid="text-free-signup">
                Free to use • Secure with Replit Auth
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card className="glass-card border-0 shadow-xl" data-testid="card-feature-tracking">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Daily Prayer Tracking</CardTitle>
                <CardDescription>
                  Log your 5 daily prayers and track completion times
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 shadow-xl" data-testid="card-feature-analytics">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Progress Analytics</CardTitle>
                <CardDescription>
                  Visualize your prayer consistency with beautiful charts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 shadow-xl" data-testid="card-feature-achievements">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Achievements</CardTitle>
                <CardDescription>
                  Earn badges and celebrate your spiritual milestones
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 shadow-xl" data-testid="card-feature-streaks">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Prayer Streaks</CardTitle>
                <CardDescription>
                  Build momentum with daily prayer streaks and habits
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 shadow-xl" data-testid="card-feature-timing">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">On-Time Tracking</CardTitle>
                <CardDescription>
                  Monitor if you're praying within the prescribed times
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 shadow-xl" data-testid="card-feature-insights">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Weekly Insights</CardTitle>
                <CardDescription>
                  Get detailed insights into your weekly prayer patterns
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-6">
            <div className="glass-card p-8 rounded-3xl border-0 shadow-2xl max-w-2xl mx-auto" data-testid="card-cta">
              <h2 className="text-3xl font-bold mb-4" data-testid="text-cta-title">
                Ready to Begin Your Journey?
              </h2>
              <p className="text-muted-foreground mb-6 text-lg" data-testid="text-cta-description">
                Join thousands of Muslims who are strengthening their prayer habits with Namaz Tracker.
              </p>
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-4 text-lg rounded-full shadow-lg"
                data-testid="button-login-cta"
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}