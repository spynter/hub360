import React from 'react';
import { Trash2, Plus, Minus, CreditCard, Package, Store } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './CartSidebar.css';

const CartSidebar = () => {
  const { 
    isOpen, 
    setIsOpen, 
    cart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getCartByStore,
    processPayment 
  } = useCart();

  const cartByStore = getCartByStore();
  const totalPrice = getTotalPrice();
  const totalItems = Object.values(cart).reduce((total, item) => total + item.quantity, 0);

  const handleQuantityChange = (productKey, change) => {
    const currentItem = cart[productKey];
    if (currentItem) {
      const newQuantity = currentItem.quantity + change;
      updateQuantity(productKey, newQuantity);
    }
  };

  const handleRemoveItem = (productKey) => {
    removeFromCart(productKey);
  };

  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clearCart();
    }
  };

  const handlePayment = () => {
    if (totalItems === 0) {
      alert('El carrito está vacío');
      return;
    }
    processPayment();
  };

  if (!isOpen) return null;

  return (
    <div className="cart-sidebar-overlay" onClick={() => setIsOpen(false)}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <h2 className="cart-title">
            <Package className="cart-title-icon" />
            Carrito de Compras
          </h2>
          <button 
            className="cart-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar carrito"
          >
            <span>×</span>
          </button>
        </div>

        {/* Cart Content */}
        <div className="cart-content">
          {totalItems === 0 ? (
            <div className="cart-empty">
              <Package className="cart-empty-icon" />
              <p>Tu carrito está vacío</p>
              <span>Agrega productos desde las tiendas</span>
            </div>
          ) : (
            <div className="cart-items">
              {cartByStore.map((store) => (
                <div key={store.storeId} className="store-section">
                  <div className="store-header">
                    <Store className="store-icon" />
                    <h3 className="store-name">{store.storeName}</h3>
                  </div>
                  
                  {store.items.map((item) => (
                    <div key={item.key} className="cart-item">
                      <div className="item-image">
                        <img 
                          src={item.image || 'https://via.placeholder.com/60x60?text=Sin+Imagen'} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60x60?text=Sin+Imagen';
                          }}
                        />
                      </div>
                      
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <p className="item-price">${parseFloat(item.price || 0).toFixed(2)}</p>
                        
                        <div className="item-quantity">
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.key, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="quantity-icon" />
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.key, 1)}
                          >
                            <Plus className="quantity-icon" />
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        className="remove-item-btn"
                        onClick={() => handleRemoveItem(item.key)}
                        aria-label="Remover producto"
                      >
                        <Trash2 className="remove-icon" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {totalItems > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span className="total-label">Total ({totalItems} productos):</span>
              <span className="total-price">${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="cart-actions">
              <button 
                className="clear-cart-btn"
                onClick={handleClearCart}
              >
                <Trash2 className="btn-icon" />
                Vaciar Carrito
              </button>
              
              <button 
                className="checkout-btn"
                onClick={handlePayment}
              >
                <CreditCard className="btn-icon" />
                Pagar Ahora
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;