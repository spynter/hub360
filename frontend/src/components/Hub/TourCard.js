// TourCard component
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './TourCard.css';

function getAbsoluteImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`;
  }
  return image;
}

function TourCard({ tour, onDelete }) {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    // Obtener cantidad de productos asociados a este tour
    api.getProductCountByTour(tour._id)
      .then(count => {
        if (mounted) setProductCount(count);
      })
      .catch(() => setProductCount(0));
    return () => { mounted = false; };
  }, [tour._id]);

  const handleEditTour = () => {
    navigate(`/editor/${tour._id}`);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este tour?')) {
      onDelete && onDelete(tour._id);
    }
  };
  
  // Contar hotspots
  const hotspotCount = tour.scenes.reduce(
    (total, scene) => total + (scene.hotspots?.length || 0), 
    0
  );

  return (
    <div className="tour-card" onClick={handleEditTour}>
      <div className="tour-thumbnail">
        {tour.scenes?.[0]?.image ? (
          <img 
            src={getAbsoluteImageUrl(tour.scenes[0].image)}
            alt={tour.name}
            onError={(e) => e.target.src = 'default-tour.jpg'}
          />
        ) : (
          <div className="thumbnail-placeholder">🖼️</div>
        )}
      </div>
      
      <div className="tour-info">
        <h3>{tour.name}</h3>
        <p className="tour-description">{tour.description || 'Sin descripción'}</p>
        
        <div className="tour-meta">
          <span className="tour-scenes">
            <strong>{tour.scenes?.length || 0}</strong> escenas
          </span>
          <span className="tour-hotspots">
            <strong>{hotspotCount}</strong> hotspots
          </span>
          <span className="tour-products">
            <strong>{productCount !== null ? productCount : '-'}</strong> productos
          </span>
        </div>
        
        <div className="tour-footer">
          <span className="tour-date">
            {new Date(tour.createdAt).toLocaleDateString()}
          </span>
          <span className="tour-api-key">
            {tour.apiKey ? `${tour.apiKey.substring(0, 8)}...` : ''}
          </span>
          <button
            className="tour-shop-btn"
            title="Ir a la tienda"
            onClick={e => {
              e.stopPropagation();
              navigate(`/shop/${tour._id}`);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '1.2rem',
              cursor: 'pointer',
              marginLeft: 8,
              borderRadius: 4,
              padding: '2px 6px',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            🛒
          </button>
          <button
            className="tour-delete-btn"
            title="Eliminar tour"
            onClick={handleDelete}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default TourCard;