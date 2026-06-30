import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { userService } from '../firebase/userService';

export const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    return {
      favorites: [],
      toggleFavorite: () => {},
      isFavorite: () => false,
      updateFavoriteDetails: () => {},
    };
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('dh_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    let isMounted = true;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // ดึงข้อมูล Profile (ใช้ Cache อัจฉริยะของ userService)
          const profile = await userService.getUserProfile(user.uid);
          if (isMounted) {
            if (profile && profile.favorites && Array.isArray(profile.favorites)) {
              // Merge LocalStorage กับ Firebase (ถ้ามีของใน LocalStorage)
              const savedGuest = localStorage.getItem('dh_favorites');
              let mergedFavorites = [...profile.favorites];
              if (savedGuest) {
                const guestFavs = JSON.parse(savedGuest);
                let updated = false;
                guestFavs.forEach(fav => {
                  if (!mergedFavorites.find(f => f.id === fav.id)) {
                    mergedFavorites.push(fav);
                    updated = true;
                  }
                });
                if (updated) {
                  await userService.updateUserProfile(user.uid, { favorites: mergedFavorites });
                }
                localStorage.removeItem('dh_favorites');
              }
              setFavorites(mergedFavorites);
            } else {
              // ยังไม่มี favorites ใน Firebase -> อัปโหลดจาก LocalStorage ไป
              const savedGuest = localStorage.getItem('dh_favorites');
              if (savedGuest) {
                const guestFavs = JSON.parse(savedGuest);
                await userService.updateUserProfile(user.uid, { favorites: guestFavs });
                setFavorites(guestFavs);
                localStorage.removeItem('dh_favorites');
              } else {
                setFavorites([]);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      } else {
        // Guest mode
        if (isMounted) {
          try {
            const saved = localStorage.getItem('dh_favorites');
            setFavorites(saved ? JSON.parse(saved) : []);
          } catch (e) { setFavorites([]); }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  const toggleFavorite = async (product) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === product.id);
      let newFavs;
      if (exists) {
        newFavs = prev.filter(p => p.id !== product.id); // Remove
      } else {
        newFavs = [...prev, product]; // Add
      }
      
      const user = auth.currentUser;
      if (user) {
        // Sync to Firebase
        userService.updateUserProfile(user.uid, { favorites: newFavs }).catch(err => console.error("Sync fav error:", err));
      } else {
        // Sync to LocalStorage
        localStorage.setItem('dh_favorites', JSON.stringify(newFavs));
      }
      return newFavs;
    });
  };

  const isFavorite = (productId) => {
    return favorites.some(p => p.id === productId);
  };

  const updateFavoriteDetails = async (productId, note, tags) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === productId);
      if (!exists) return prev;
      
      const newFavs = prev.map(p => 
        p.id === productId ? { ...p, note: note !== undefined ? note : p.note, tags: tags !== undefined ? tags : p.tags } : p
      );
      
      const user = auth.currentUser;
      if (user) {
        // Sync to Firebase
        userService.updateUserProfile(user.uid, { favorites: newFavs }).catch(err => console.error("Sync fav error:", err));
      } else {
        // Sync to LocalStorage
        localStorage.setItem('dh_favorites', JSON.stringify(newFavs));
      }
      return newFavs;
    });
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, updateFavoriteDetails }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesProvider;
