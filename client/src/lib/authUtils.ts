import { toast } from '@/hooks/use-toast';

export function handleAuthError(error: any) {
  if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
    toast({
      title: "Session Expired",
      description: "Please log in again to continue using the app.",
      variant: "destructive",
    });
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/api/login';
    }, 2000);
    
    return true; // Indicates this was an auth error
  }
  
  return false; // Not an auth error
}

export function createAuthAwareQuery<T>(queryFn: () => Promise<T>) {
  return async () => {
    try {
      return await queryFn();
    } catch (error: any) {
      if (handleAuthError(error)) {
        throw error; // Re-throw to maintain query error state
      }
      throw error;
    }
  };
}

export function createAuthAwareMutation<T, U>(mutationFn: (data: T) => Promise<U>) {
  return async (data: T) => {
    try {
      return await mutationFn(data);
    } catch (error: any) {
      if (handleAuthError(error)) {
        throw error; // Re-throw to maintain mutation error state
      }
      throw error;
    }
  };
}

export function isAuthError(error: any): boolean {
  return error?.message?.includes('401') || error?.message?.includes('Unauthorized');
}