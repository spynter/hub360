import React from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './FloatingCart.css';

const FloatingCart = () => {
  const { isOpen, setIsOpen, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="floating-cart">
      <button 
        className="cart-toggle-btn"
        onClick={toggleCart}
        aria-label="Abrir carrito"
      >
        {isOpen ? (
          <X className="cart-icon" />
        ) : (
          <ShoppingCart className="cart-icon" />
        )}
        {totalItems > 0 && (
          <span className="cart-badge">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingCart;