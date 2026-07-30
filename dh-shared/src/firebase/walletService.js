import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export const sharedWalletService = {
  subscribeToWalletAndPoints: (db, usersPath, customerId, callback) => {
    if (!customerId) {
      callback({ walletBalance: 0, creditPoints: 0 });
      return () => {};
    }

    const userRef = doc(db, usersPath, customerId);
    
    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const wallet = Number(data.walletBalance ?? 0);
          const points = Number(data.creditPoints ?? 0);

          callback({
            walletBalance: isNaN(wallet) ? 0 : wallet,
            creditPoints: isNaN(points) ? 0 : points
          });
        } else {
          callback({ walletBalance: 0, creditPoints: 0 });
        }
      }, 
      (error) => {
        console.error(`Error subscribing to wallet data for ${customerId}:`, error);
        callback({ walletBalance: 0, creditPoints: 0 });
      }
    );

    return unsubscribe;
  },

  getWalletAndPoints: async (db, usersPath, customerId) => {
    if (!customerId) return { walletBalance: 0, creditPoints: 0 };
    
    try {
      const userRef = doc(db, usersPath, customerId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const wallet = Number(data.walletBalance ?? 0);
        const points = Number(data.creditPoints ?? 0);

        return {
          walletBalance: isNaN(wallet) ? 0 : wallet,
          creditPoints: isNaN(points) ? 0 : points
        };
      }
      return { walletBalance: 0, creditPoints: 0 };
    } catch (error) {
      console.error(`Error fetching wallet data for ${customerId}:`, error);
      throw error;
    }
  }
};
