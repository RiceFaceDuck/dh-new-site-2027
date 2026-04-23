import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CartContext } from './CartContext.jsx';

export const CartProvider = ({ children }) => {
  const [cartTotalQty, setCartTotalQty] = useState(0);

  useEffect(() => {
    const auth = getAuth();

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, listen to their cart document
        const cartRef = doc(db, 'carts', user.uid);

        // This onSnapshot uses 1 Read initially, then pushes updates locally without extra Read costs.
        // It provides real-time updates across multiple tabs/components.
        const unsubscribeCart = onSnapshot(cartRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCartTotalQty(data.totalQty || 0);
          } else {
            setCartTotalQty(0);
          }
        }, (error) => {
            console.error("Cart subscription error:", error);
        });

        // Cleanup listener when user logs out or component unmounts
        return () => unsubscribeCart();
      } else {
        // User is signed out
        setCartTotalQty(0);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <CartContext.Provider value={{ cartTotalQty }}>
      {children}
    </CartContext.Provider>
  );
};
