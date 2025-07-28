import React, { useState } from 'react';
import { Search, MapPin, Star, ShoppingCart, Camera, Navigation, Store, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Comercios360.css';

const featuredStores = [
  {
    id: 1,
    name: "Café Central",
    category: "Restaurante",
    rating: 4.8,
    distance: "0.2 km",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    has360: true,
    featured: true,
    description: "Café artesanal con ambiente acogedor",
  },
  {
    id: 2,
    name: "Boutique Luna",
    category: "Moda",
    rating: 4.6,
    distance: "0.5 km",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
    has360: true,
    featured: true,
    description: "Moda femenina exclusiva y elegante",
  },
  {
    id: 3,
    name: "Librería Mundo",
    category: "Cultura",
    rating: 4.9,
    distance: "0.8 km",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80",
    has360: true,
    featured: false,
    description: "Libros, cultura y conocimiento",
  },
  {
    id: 4,
    name: "Panadería Artesanal",
    category: "Alimentación",
    rating: 4.7,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    has360: true,
    featured: false,
    description: "Pan fresco horneado diariamente",
  },
];

const categories = [
  { name: "Restaurantes", icon: "🍽️", count: 234 },
  { name: "Moda", icon: "👗", count: 156 },
  { name: "Tecnología", icon: "📱", count: 89 },
  { name: "Salud", icon: "🏥", count: 67 },
  { name: "Belleza", icon: "💄", count: 123 },
  { name: "Hogar", icon: "🏠", count: 98 },
];

const Comercios360 = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const navigate = useNavigate();

  const handleStoreClick = (storeId) => {
    // Navegar al viewer del tour 360
    navigate(`/viewer/${storeId}`);
  };

  return (
    <div className="comercios360-container">
      {/* Header */}
      <div className="comercios360-header">
        <div className="header-content">
          <div className="header-top">
            <div>
              <h1 className="header-title">Comercios 360°</h1>
              <p className="header-subtitle">Descubre tu ciudad</p>
            </div>
            <div className="header-actions">
              <button className="icon-button">
                <Heart className="icon" />
              </button>
              <button className="icon-button cart-button">
                <ShoppingCart className="icon" />
                <span className="cart-badge">3</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar comercios, productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="tabs-container">
          <div className="tabs-list">
            <button 
              className={`tab-button ${activeTab === 'discover' ? 'active' : ''}`}
              onClick={() => setActiveTab('discover')}
            >
              Descubrir
            </button>
            <button 
              className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              Mapa
            </button>
            <button 
              className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Categorías
            </button>
          </div>

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div className="tab-content">
              {/* Featured Section */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">Destacados</h2>
                  <button className="view-all-button">Ver todos</button>
                </div>

                <div className="featured-stores">
                  {featuredStores
                    .filter((store) => store.featured)
                    .map((store) => (
                      <div key={store.id} className="store-card featured" onClick={() => handleStoreClick(store.id)}>
                        <div className="store-image-container">
                          <img
                            src={store.image}
                            alt={store.name}
                            className="store-image"
                          />
                          {store.has360 && (
                            <span className="badge-360">
                              <Camera className="badge-icon" />
                              360°
                            </span>
                          )}
                        </div>
                        <div className="store-content">
                          <div className="store-info">
                            <div className="store-details">
                              <h3 className="store-name">{store.name}</h3>
                              <p className="store-description">{store.description}</p>
                              <div className="store-meta">
                                <div className="rating">
                                  <Star className="star-icon" />
                                  <span>{store.rating}</span>
                                </div>
                                <div className="distance">
                                  <MapPin className="location-icon" />
                                  <span>{store.distance}</span>
                                </div>
                              </div>
                            </div>
                            <span className="category-badge">{store.category}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* All Stores */}
              <div className="section">
                <h2 className="section-title">Cerca de ti</h2>
                <div className="all-stores">
                  {featuredStores.map((store) => (
                    <div key={store.id} className="store-card compact" onClick={() => handleStoreClick(store.id)}>
                      <div className="store-content-compact">
                        <img
                          src={store.image}
                          alt={store.name}
                          className="store-thumbnail"
                        />
                        <div className="store-info-compact">
                          <div className="store-header-compact">
                            <h3 className="store-name-compact">{store.name}</h3>
                            {store.has360 && (
                              <span className="badge-360-small">
                                <Camera className="badge-icon-small" />
                                360°
                              </span>
                            )}
                          </div>
                          <p className="store-description-compact">{store.description}</p>
                          <div className="store-meta-compact">
                            <div className="rating-compact">
                              <Star className="star-icon-small" />
                              <span>{store.rating}</span>
                            </div>
                            <span className="separator">•</span>
                            <span>{store.distance}</span>
                            <span className="separator">•</span>
                            <span>{store.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === 'map' && (
            <div className="tab-content">
              <div className="map-placeholder">
                <Navigation className="map-icon" />
                <p className="map-text">Mapa interactivo</p>
                <p className="map-subtext">Próximamente disponible</p>
              </div>

              <div className="nearby-stores">
                <h3 className="nearby-title">Comercios cercanos</h3>
                {featuredStores.slice(0, 3).map((store) => (
                  <div key={store.id} className="nearby-store">
                    <div className="nearby-store-info">
                      <div className="location-dot"></div>
                      <div>
                        <p className="nearby-store-name">{store.name}</p>
                        <p className="nearby-store-distance">{store.distance}</p>
                      </div>
                    </div>
                    <button className="view-button">Ver</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="tab-content">
              <div className="categories-grid">
                {categories.map((category) => (
                  <div key={category.name} className="category-card">
                    <div className="category-icon">{category.icon}</div>
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-count">{category.count} comercios</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        <div className="nav-content">
          <button className="nav-button active">
            <Store className="nav-icon" />
            <span className="nav-text">Inicio</span>
          </button>
          <button className="nav-button">
            <Search className="nav-icon" />
            <span className="nav-text">Buscar</span>
          </button>
          <button className="nav-button">
            <Navigation className="nav-icon" />
            <span className="nav-text">Mapa</span>
          </button>
          <button className="nav-button cart-nav">
            <ShoppingCart className="nav-icon" />
            <span className="nav-text">Carrito</span>
            <span className="cart-badge-nav">3</span>
          </button>
        </div>
      </div>

      {/* Spacing for fixed bottom nav */}
      <div className="bottom-spacing"></div>
    </div>
  );
};

export default Comercios360; 