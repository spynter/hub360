import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
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
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

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

  const handleAddToCart = (product) => {
    addToCart(product, tourId, 1);
    // Mostrar confirmación
    alert(`¡${product.name} agregado al carrito!`);
  };

  if (loading) return (
    <div className="shop-loading">
      <div className="loading-spinner"></div>
      <p>Cargando tienda...</p>
    </div>
  );

  return (
    <div className="shop-container">
      {/* Header con navegación */}
      <header className="shop-header">
        <button
          className="shop-back-btn"
          onClick={() => window.history.back()}
        >
          ← Volver
        </button>
        <div className="shop-header-info">
          <h1 className="shop-title">{tour?.name || 'Tienda'}</h1>
          <p className="shop-subtitle">Descubre nuestros productos</p>
        </div>
      </header>

      {/* Banner de la tienda */}
      <div className="shop-banner">
        <div className="shop-banner-content">
          <div className="shop-banner-text">
            <h2>{tour?.name || 'Tienda'}</h2>
            <p>{tour?.description || 'Explora nuestra selección de productos de calidad'}</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="shop-main">
        {products.length === 0 ? (
          <div className="shop-empty-state">
            <div className="empty-state-icon">🛍️</div>
            <h3>No hay productos disponibles</h3>
            <p>Esta tienda aún no tiene productos. Vuelve más tarde.</p>
          </div>
        ) : (
          <>
            {/* Información de productos */}
            <div className="shop-products-info">
              <h3>Productos ({products.length})</h3>
              <p>Selecciona los productos que deseas agregar a tu carrito</p>
            </div>

            {/* Grid de productos */}
            <div className="shop-products-grid">
              {products.map(product => (
                <div className="shop-product-card" key={product._id}>
                  <div className="product-image-container">
                    <img
                      src={getAbsoluteImageUrl(product.image)}
                      alt={product.name}
                      className="product-image"
                      onError={e => { 
                        e.target.src = 'https://via.placeholder.com/300x300/23272f/38bdf8?text=Sin+Imagen'; 
                      }}
                    />
                    <div className="product-overlay">
                      <button
                        className="product-quick-add"
                        onClick={() => handleAddToCart(product)}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                  
                  <div className="product-content">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-footer">
                      <span className="product-price">${product.price.toFixed(2)}</span>
                      <button
                        className="product-add-btn"
                        onClick={() => handleAddToCart(product)}
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Shop;