import { supabase } from './supabase';
import { AUTH_CREDENTIALS } from './auth';

const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 2 seconds base delay

// Helper functions for error handling
function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('network') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('Network request failed') ||
    error?.name === 'NetworkError'
  );
}

function isRateLimitError(error: any): boolean {
  return (
    error?.status === 429 ||
    error?.message?.includes('rate limit') ||
    error?.message?.includes('too many requests')
  );
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = BASE_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait before each attempt except the first one
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt);
        await wait(delay);
      }
      
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      // For rate limit errors, wait longer
      if (isRateLimitError(error)) {
        const delay = baseDelay * Math.pow(3, attempt); // More aggressive backoff
        await wait(delay);
        continue;
      }
      
      // If user exists, break the retry loop
      if (error?.message?.includes('already registered')) {
        break;
      }
      
      // For network errors, continue retrying
      if (!isNetworkError(error) || attempt === maxRetries - 1) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

export async function createInitialUser() {
  try {
    // Try to get existing session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return { data: { user: session.user }, error: null };
    }

    // Try to sign in
    try {
      const { data: signInData, error: signInError } = await retryOperation(
        () => supabase.auth.signInWithPassword({
          email: AUTH_CREDENTIALS.email,
          password: AUTH_CREDENTIALS.password,
        })
      );

      if (!signInError && signInData.user) {
        return { data: signInData, error: null };
      }
    } catch (signInErr: any) {
      // Only throw if it's not an invalid credentials error
      if (!signInErr.message?.includes('Invalid login credentials')) {
        throw signInErr;
      }
    }

    // Wait before attempting sign up
    await wait(BASE_DELAY);

    // Attempt sign up
    const { data: signUpData, error: signUpError } = await retryOperation(
      () => supabase.auth.signUp({
        email: AUTH_CREDENTIALS.email,
        password: AUTH_CREDENTIALS.password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      })
    );

    if (signUpError) {
      if (signUpError.message?.includes('already registered')) {
        // Wait before final sign in attempt
        await wait(BASE_DELAY);
        
        const { data: retryData, error: retryError } = await retryOperation(
          () => supabase.auth.signInWithPassword({
            email: AUTH_CREDENTIALS.email,
            password: AUTH_CREDENTIALS.password,
          })
        );

        if (retryError) throw retryError;
        return { data: retryData, error: null };
      }
      throw signUpError;
    }

    return { data: signUpData, error: null };
  } catch (err) {
    console.error('Error in createInitialUser:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unknown error occurred')
    };
  }
}
