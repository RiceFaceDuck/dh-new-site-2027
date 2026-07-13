import { createContext, useState, useContext } from 'react';

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
  const [shippingRules] = useState([]);
  const [promotions] = useState([]);
  const [freebies] = useState([]);
  const [isConfigLoaded] = useState(true);

  return (
    <OrderContext.Provider value={{ shippingRules, promotions, freebies, isConfigLoaded }}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
