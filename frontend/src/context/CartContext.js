import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('hub360_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('hub360_cart', JSON.stringify(cart));
  }, [cart]);

  // Agregar producto al carrito
  const addToCart = (product, storeId, quantity = 1) => {
    setCart(prev => {
      const productKey = `${storeId}_${product._id}`;
      const existing = prev[productKey];
      
      if (existing) {
        return {
          ...prev,
          [productKey]: {
            ...existing,
            quantity: existing.quantity + quantity
          }
        };
      } else {
        return {
          ...prev,
          [productKey]: {
            ...product,
            storeId,
            storeName: product.storeName || 'Tienda',
            quantity,
            addedAt: new Date().toISOString()
          }
        };
      }
    });
  };

  // Remover producto del carrito
  const removeFromCart = (productKey) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productKey];
      return newCart;
    });
  };

  // Actualizar cantidad de un producto
  const updateQuantity = (productKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productKey);
      return;
    }
    
    setCart(prev => ({
      ...prev,
      [productKey]: {
        ...prev[productKey],
        quantity
      }
    }));
  };

  // Vaciar carrito completo
  const clearCart = () => {
    setCart({});
  };

  // Obtener total de productos en el carrito
  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  // Obtener total del precio
  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // Obtener productos agrupados por tienda
  const getCartByStore = () => {
    const stores = {};
    Object.entries(cart).forEach(([key, item]) => {
      if (!stores[item.storeId]) {
        stores[item.storeId] = {
          storeId: item.storeId,
          storeName: item.storeName,
          items: []
        };
      }
      stores[item.storeId].items.push({ ...item, key });
    });
    return Object.values(stores);
  };

  // Procesar pago (placeholder para futura implementación)
  const processPayment = () => {
    // Aquí se implementaría la lógica de pago
    console.log('Procesando pago:', cart);
    alert('Funcionalidad de pago en desarrollo');
  };

  const value = {
    cart,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getCartByStore,
    processPayment
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};