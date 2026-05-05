import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

const OrderContext = createContext();

export const useOrderConfig = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    return {
      shippingRules: [],
      promotions: [],
      freebies: [],
      isConfigLoaded: false
    };
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [shippingRules, setShippingRules] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [freebies, setFreebies] = useState([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    let unsubs = [];

    const fetchConfig = () => {
      try {
        const shipRef = collection(db, 'shipping_rules');
        const unsubShip = onSnapshot(shipRef, (snap) => {
          setShippingRules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("OrderContext Shipping fetch error", err));
        unsubs.push(unsubShip);

        const promoRef = collection(db, 'promotions');
        const unsubPromo = onSnapshot(promoRef, (snap) => {
          setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("OrderContext Promotions fetch error", err));
        unsubs.push(unsubPromo);
        
        const freebieRef = collection(db, 'freebies');
        const unsubFreebie = onSnapshot(freebieRef, (snap) => {
          setFreebies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("OrderContext Freebies fetch error", err));
        unsubs.push(unsubFreebie);

        setIsConfigLoaded(true);
      } catch(err) {
        console.error("OrderContext initialize error", err);
        setIsConfigLoaded(true);
      }
    };

    fetchConfig();

    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  return (
    <OrderContext.Provider value={{ shippingRules, promotions, freebies, isConfigLoaded }}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
