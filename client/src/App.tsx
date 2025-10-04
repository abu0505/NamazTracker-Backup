import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { PrayerProvider } from "./contexts/prayer-context";
import { Navigation } from "./components/navigation";
import { ThemeToggle } from "./components/theme-toggle";
// import { AuthContext, type AuthContextType, useAuthQuery } from "./hooks/useAuth";
// import { Button } from "@/components/ui/button";
// import { LogOut, User } from "lucide-react";
// import { Skeleton } from "@/components/ui/skeleton";
import Dashboard from "./pages/dashboard";
import Qaza from "./pages/qaza";
import Achievements from "./pages/achievements";
import Analytics from "./pages/analytics";
// import Login from "./pages/login.tsx";
// import Landing from "./pages/landing";
import NotFound from "@/pages/not-found";

// AUTHENTICATION REMOVED - All auth-related code commented out
// function AuthProvider({ children }: { children: React.ReactNode }) {
//   const auth = useAuthQuery();
//   
//   return (
//     <AuthContext.Provider value={auth}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// function AuthenticatedHeader({ user, logout }: { user: any; logout: () => void }) {
//   return (
//     <header className="glass-nav px-4 py-3 m-4 rounded-2xl" data-testid="header-authenticated">
//       <div className="flex items-center justify-between max-w-6xl mx-auto">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
//             <span className="text-primary-foreground text-lg">🕌</span>
//           </div>
//           <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
//             Namaz Tracker
//           </h1>
//         </div>
//         
//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-user-info">
//             <User className="w-4 h-4" />
//             <span>{user?.firstName || user?.email?.split('@')[0] || 'User'}</span>
//           </div>
//           <ThemeToggle />
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={logout}
//             className="flex items-center gap-2"
//             data-testid="button-logout"
//           >
//             <LogOut className="w-4 h-4" />
//             Logout
//           </Button>
//         </div>
//       </div>
//     </header>
//   );
// }

function SimpleHeader() {
  return (
    <header className="glass-nav px-4 py-3 m-4 rounded-2xl" data-testid="header-authenticated">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-lg">🕌</span>
          </div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
            Namaz Tracker
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/qaza" component={Qaza} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

// function LoadingScreen() {
//   return (
//     <div className="min-h-screen flex items-center justify-center" data-testid="loading-auth">
//       <div className="text-center space-y-4">
//         <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center animate-pulse">
//           <span className="text-primary-foreground text-2xl">🕌</span>
//         </div>
//         <Skeleton className="h-4 w-48 mx-auto" />
//         <Skeleton className="h-4 w-32 mx-auto" />
//       </div>
//     </div>
//   );
// }

// LANDING PAGE COMMENTED OUT - Direct access to dashboard
// function AppContent() {
//   const { user, isLoading, isAuthenticated, logout } = useAuthQuery();
//
//   if (isLoading) {
//     return <LoadingScreen />;
//   }
//
//   if (!isAuthenticated) {
//     return <Landing />;
//   }
//
//   return (
//     <PrayerProvider>
//       <div className="min-h-screen">
//         <AuthenticatedHeader user={user} logout={logout} />
//         <main className="pb-24 px-4 max-w-6xl mx-auto">
//           <AuthenticatedRouter />
//         </main>
//         <Navigation />
//       </div>
//     </PrayerProvider>
//   );
// }

function AppContent() {
  return (
    <PrayerProvider>
      <div className="min-h-screen">
        <SimpleHeader />
        <main className="pb-24 px-4 max-w-6xl mx-auto">
          <AppRouter />
        </main>
        <Navigation />
      </div>
    </PrayerProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
