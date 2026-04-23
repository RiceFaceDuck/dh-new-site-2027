import { useContext } from 'react';
import { CartContext } from '../contexts/CartContext.jsx';

export const useCart = () => useContext(CartContext);
