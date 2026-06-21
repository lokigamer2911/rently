import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useAuthContext();
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
