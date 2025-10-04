import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { Calendar } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Login() {
  const [location, navigate] = useLocation();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token, user } = await response.json();

      // Store token in localStorage
      localStorage.setItem('authToken', token);

      // Redirect to dashboard or original location
      const redirectTo = new URLSearchParams(location.split('?')[1]).get('redirect') || '/dashboard';
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          passwordHash: data.password, // Pass plain password, let server hash it
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const { token, user } = await response.json();

      // Store token in localStorage
      localStorage.setItem('authToken', token);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Namaz Tracker</h1>
          <p className="text-muted-foreground">Track your daily prayers</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <Input
                      {...loginForm.register('username')}
                      placeholder="Username"
                      disabled={isLoading}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      {...loginForm.register('password')}
                      type="password"
                      placeholder="Password"
                      disabled={isLoading}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <Input
                      {...registerForm.register('username')}
                      placeholder="Username"
                      disabled={isLoading}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      {...registerForm.register('email')}
                      type="email"
                      placeholder="Email"
                      disabled={isLoading}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      {...registerForm.register('password')}
                      type="password"
                      placeholder="Password"
                      disabled={isLoading}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      {...registerForm.register('firstName')}
                      placeholder="First Name (optional)"
                      disabled={isLoading}
                    />
                    <Input
                      {...registerForm.register('lastName')}
                      placeholder="Last Name (optional)"
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
