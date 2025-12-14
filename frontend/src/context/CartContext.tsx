import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface CartItem {
  sweetId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (sweet: any) => void;
  removeFromCart: (sweetId: string) => void;
  updateQuantity: (sweetId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Filter out items without sweetId (corrupted data)
        return Array.isArray(parsed) ? parsed.filter((item: any) => item.sweetId) : [];
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (sweet: any) => {
    setCart((prevCart) => {
      // Handle both _id (from Sweet object) and sweetId (from CartItem object)
      const id = sweet.sweetId || sweet._id;
      const existingItem = prevCart.find(item => item.sweetId === id);
      
      if (existingItem) {
        // Update quantity if item exists
        return prevCart.map(item =>
          item.sweetId === id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.maxQuantity) }
            : item
        );
      } else {
        // Add new item
        return [...prevCart, {
          sweetId: id,
          name: sweet.name,
          category: sweet.category,
          price: sweet.price,
          quantity: sweet.quantity || 1,
          maxQuantity: sweet.maxQuantity || sweet.quantity
        }];
      }
    });
  };

  const removeFromCart = (sweetId: string) => {
    setCart(prevCart => prevCart.filter(item => item.sweetId !== sweetId));
  };

  const updateQuantity = (sweetId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(sweetId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.sweetId === sweetId
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
