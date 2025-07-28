import React, { useEffect, useState } from 'react';
import './Shop.css';

// Utilidad para obtener la URL absoluta de la imagen
function getAbsoluteImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`;
  }
  return image;
}

function Shop({ tourId }) {
  const [products, setProducts] = useState([]);
  const [tour, setTour] = useState(null);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Obtener datos del tour (nombre de la tienda)
        const tourRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/tours/${tourId}`);
        const tourData = await tourRes.json();
        setTour(tourData);

        // Obtener productos asociados a este tour/tienda
        const prodRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/products/by-tour/${tourId}`);
        if (!prodRes.ok) {
          setProducts([]);
        } else {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : []);
        }
      } catch (err) {
        setProducts([]);
      }
      setLoading(false);
    }
    if (tourId) fetchData();
  }, [tourId]);

  const handleQuantityChange = (productId, value) => {
    setCart(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, Number(value) || 1)
      }
    }));
  };

  const handleAddToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product._id]: {
        ...product,
        quantity: prev[product._id]?.quantity || 1
      }
    }));
  };

  if (loading) return <div className="shop-loading">Cargando tienda...</div>;

  return (
    <div className="shop-container">
      <button
        className="shop-back-btn"
        style={{
          marginBottom: 24,
          background: '#23272f',
          color: '#38bdf8',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '1rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s'
        }}
        onClick={() => window.history.back()}
      >
        ← Volver
      </button>
      <h1 className="shop-title">{tour?.name ? `Tienda: ${tour.name}` : 'Tienda'}</h1>
      <div className="shop-grid">
        {products.length === 0 ? (
          <div style={{ color: '#a3a3a3', fontSize: '1.1rem', gridColumn: '1/-1', textAlign: 'center', padding: 32 }}>
            No hay productos en esta tienda.
          </div>
        ) : (
          products.map(product => (
            <div className="shop-card" key={product._id}>
              <div className="shop-card-image">
                <img
                  src={getAbsoluteImageUrl(product.image)}
                  alt={product.name}
                  onError={e => { e.target.src = 'https://via.placeholder.com/300x180?text=Sin+Imagen'; }}
                />
              </div>
              <div className="shop-card-content">
                <h2 className="shop-card-title">{product.name}</h2>
                <p className="shop-card-desc">{product.description}</p>
                <div className="shop-card-price">${product.price.toFixed(2)}</div>
                <div className="shop-card-actions">
                  <input
                    type="number"
                    min="1"
                    className="shop-qty-input"
                    value={cart[product._id]?.quantity || 1}
                    onChange={e => handleQuantityChange(product._id, e.target.value)}
                  />
                  <button
                    className="shop-add-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    Añadir al carrito
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="shop-cart-float">
        <span>🛒</span>
        <span>
          {Object.values(cart).reduce((acc, item) => acc + (item.quantity || 1), 0)} productos
        </span>
      </div>
    </div>
  );
}

export default Shop;
