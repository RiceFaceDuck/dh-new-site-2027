import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useNavbarAuth() {
  const { currentUser, logout } = useAuth();
  const { loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Click outside & Escape key handler for Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitial = (email) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return {
    currentUser,
    loading,
    isDropdownOpen,
    setIsDropdownOpen,
    isLoggingOut,
    dropdownRef,
    handleLogout,
    getInitial,
  };
}
