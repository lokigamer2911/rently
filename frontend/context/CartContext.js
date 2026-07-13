import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

function normalizeCart(items) {
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(normalizeCart(JSON.parse(savedCart)));
      }
    } catch {
      if (typeof window !== 'undefined') localStorage.removeItem('cart');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, isHydrated]);

  const addToCart = (item) => {
    let added = false;
    setCart(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      added = true;
      return [...prev, item];
    });
    return added;
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.length;

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
