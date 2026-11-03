import { useAuth } from '../context/AuthContext';

export function useNavbarAuth() {
  const { currentUser, loading } = useAuth();

  const getInitial = (email) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return {
    currentUser,
    loading,
    getInitial,
  };
}
