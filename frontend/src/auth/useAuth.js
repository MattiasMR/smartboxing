import { useContext } from 'react';
import { AuthCtx } from './AuthProvider';

export function useAuth() { 
  return useContext(AuthCtx); 
}
