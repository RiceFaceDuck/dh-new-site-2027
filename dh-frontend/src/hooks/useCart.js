import { useCart as useCartProvider, useCartState as useCartStateProvider, useCartDispatch as useCartDispatchProvider } from '../context/CartProvider';

export const useCart = useCartProvider;
export const useCartState = useCartStateProvider;
export const useCartDispatch = useCartDispatchProvider;

export default useCart;