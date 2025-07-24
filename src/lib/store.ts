import { atom } from 'jotai';
import type { User } from '@supabase/supabase-js';

// Atoms with hydration from sessionStorage
const getInitialUser = () => {
  try {
    const cached = sessionStorage.getItem('sb-session');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.value?.user) {
        return parsed.value.user;
      }
    }
  } catch (e) {
    console.warn('Failed to hydrate user from storage:', e);
  }
  return null;
};

export const userAtom = atom<User | null>(getInitialUser());
export const loadingAtom = atom<boolean>(true);
