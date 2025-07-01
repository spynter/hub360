// TourCard component
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  const handleEditTour = () => {
    navigate(`/editor/${tour._id}`);
  };
  
  // Contar hotspots
  const hotspotCount = tour.scenes.reduce(
    (total, scene) => total + (scene.hotspots?.length || 0), 
    0
  );

  const handleDeleteTour = (e) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este tour?')) {
      onDelete && onDelete(tour._id);
    }
  };

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
        </div>
        
        <div className="tour-footer">
          <span className="tour-date">
            {new Date(tour.createdAt).toLocaleDateString()}
          </span>
          <span className="tour-api-key">
            {tour.apiKey ? `${tour.apiKey.substring(0, 8)}...` : ''}
          </span>
        </div>
        
        <button
          className="btn-delete-tour"
          onClick={handleDeleteTour}
          style={{
            marginTop: 10,
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Eliminar Tour
        </button>
      </div>
    </div>
  );
}

export default TourCard;